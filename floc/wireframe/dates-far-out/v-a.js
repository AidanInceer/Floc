import { ico } from "/_house/kit/trip-frame.mjs";
import { PEOPLE, ME, nameOf, upper, faces, waiting, span, nightsOf, cal, day, rangeCls, tripCls, pickRange, setBtn, rail } from "./shared.js";

const ANSWERS = [["yes", "Yes"], ["maybe", "If need be"], ["no", "No"]];

export function seed(group) {
  if (group === "none") return { options: [], answers: {}, adding: true, pick: null, next: 1 };
  return {
    options: [
      { id: "o1", a: "2027-02-06", b: "2027-02-13", by: "na" },
      { id: "o2", a: "2027-02-13", b: "2027-02-20", by: "na" },
      { id: "o3", a: "2027-02-17", b: "2027-02-21", by: "ca" },
    ],
    answers: {
      o1: { na: "yes", me: "maybe", ca: "no", jo: "yes" },
      o2: { na: "yes", me: "yes", ca: "maybe", jo: "yes" },
      o3: { na: "maybe", me: "yes", ca: "yes", jo: "no" },
    },
    adding: false,
    pick: null,
    next: 4,
  };
}

const who = (v, id, kind) => PEOPLE.filter((p) => v.answers[id]?.[p.id] === kind).map((p) => p.id);
const count = (v, o) => ({ o, yes: who(v, o.id, "yes").length, maybe: who(v, o.id, "maybe").length, no: who(v, o.id, "no").length });
function leading(v) {
  return v.options.map((o) => count(v, o)).filter((r) => r.yes + r.maybe > 0)
    .sort((x, y) => y.yes * 2 + y.maybe - (x.yes * 2 + x.maybe) || y.yes - x.yes || x.no - y.no || (x.o.a < y.o.a ? -1 : 1))[0] ?? null;
}
const answered = (v) => PEOPLE.filter((p) => v.options.some((o) => v.answers[o.id]?.[p.id]));

function tally(v, o) {
  const parts = ANSWERS.map(([k, label]) => {
    const ids = who(v, o.id, k);
    return ids.length ? `<span class="tl">${faces(ids, 20)}<span class="sub">${ids.length} ${label.toLowerCase()}</span></span>` : "";
  }).join("");
  return parts || `<span class="sub">No answers yet</span>`;
}

function row(v, o, lead) {
  const mine = v.answers[o.id]?.[ME.id];
  const range = span(o.a, o.b);
  return `<div class="opt"><div class="opt-when"><span class="top"><span class="when">${range}</span>${lead ? `<span class="badge">Leading</span>` : ""}</span>` +
    `<span class="sub">${nightsOf(o.a, o.b)}, from ${nameOf(o.by)}</span></div>` +
    `<div class="opt-tally">${tally(v, o)}</div>` +
    `<div class="track" role="group" aria-label="Your answer for ${range}">${ANSWERS.map(([k, label]) =>
      `<button type="button" data-act="a-answer" data-id="${o.id}" data-v="${k}" data-k="ans-${o.id}-${k}" aria-pressed="${mine === k}">${label}</button>`).join("")}</div></div>`;
}

function adder(s, v) {
  const done = v.pick?.b;
  return `<div class="part"><p class="hint">Press the first day, then the last</p>` +
    cal(s.ym, (iso) => day(iso, { act: "a-day", cls: rangeCls(iso, v.pick, "pick-on") + tripCls(s, iso) })) +
    `<div class="bar"><span class="when">${done ? `${span(v.pick.a, v.pick.b)}, ${nightsOf(v.pick.a, v.pick.b)}` : ""}</span><span class="bar-acts">` +
    (v.options.length || v.pick ? `<button type="button" class="btn" data-act="a-cancel" data-k="a-cancel">Discard</button>` : "") +
    (done ? `<button type="button" class="btn btn-primary" data-act="a-save" data-k="a-save">Add option</button>` : "") + `</span></div></div>`;
}

function side(s, v) {
  const lead = leading(v);
  const ans = answered(v);
  const rest = PEOPLE.filter((p) => !ans.includes(p)).map((p) => p.id);
  if (!lead) return `<section class="card"><div class="card-head"><h2>Leading</h2></div><p class="hint">${v.options.length ? "No answers yet" : "No options yet"}</p>${v.options.length ? waiting(rest) : ""}</section>`;
  const { o, yes, maybe, no } = lead;
  const bits = [yes && `${yes} yes`, maybe && `${maybe} if need be`, no && `${no} no`].filter(Boolean).join(", ");
  return `<section class="card"><div class="card-head"><h2>Leading</h2></div>` +
    `<div class="stack"><span class="big">${span(o.a, o.b)}</span><span class="sub">${nightsOf(o.a, o.b)}</span></div>` +
    `<p class="hint">${upper(bits)}</p>${waiting(rest)}<div>${setBtn(s, o.a, o.b)}</div></section>`;
}

export function view(s) {
  const v = s.A;
  const lead = leading(v);
  const head = `<div class="card-head"><h2>Options</h2>${v.adding ? "" : `<button type="button" class="btn" data-act="a-add" data-k="a-add">${ico("plus")}Add an option</button>`}</div>`;
  const rows = v.options.map((o) => row(v, o, lead?.o === o)).join("");
  return {
    rail: rail("Options", "Options"),
    main: `<section class="card">${head}${v.adding ? adder(s, v) : ""}${rows}</section>`,
    side: side(s, v),
  };
}

export function act(d, s) {
  const v = s.A;
  if (d.act === "a-answer") {
    const mine = (v.answers[d.id] ??= {});
    if (mine[ME.id] === d.v) delete mine[ME.id];
    else mine[ME.id] = d.v;
  }
  if (d.act === "a-add") v.adding = true;
  if (d.act === "a-cancel") { v.pick = null; v.adding = v.options.length === 0; }
  if (d.act === "a-day") v.pick = pickRange(v.pick, d.iso);
  if (d.act === "a-save" && v.pick?.b) {
    const id = `o${v.next++}`;
    v.options.push({ id, a: v.pick.a, b: v.pick.b, by: ME.id });
    v.options.sort((x, y) => (x.a < y.a ? -1 : x.a > y.a ? 1 : 0));
    v.answers[id] = { [ME.id]: "yes" };
    v.pick = null;
    v.adding = false;
  }
}
