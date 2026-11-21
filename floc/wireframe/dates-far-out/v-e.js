import { PEOPLE, ME, nameOf, nameList, upper, faces, waiting, span, nightsOf, cal, day, rangeCls, tripCls, pickRange, setBtn, rail } from "./shared.js";

const RATHER = [["earlier", "Earlier"], ["later", "Later"], ["shorter", "Shorter"], ["longer", "Longer"]];

export function seed(group) {
  if (group === "none") return { prop: null, react: {}, pick: null };
  return { prop: { a: "2027-02-13", b: "2027-02-20", by: "na" }, react: { na: "works", me: "works", ca: "shorter", jo: "works" }, pick: null };
}

const who = (v, kind) => PEOPLE.filter((p) => v.react[p.id] === kind).map((p) => p.id);
const chip = (v, key, label) =>
  `<button type="button" class="pick" data-act="e-react" data-v="${key}" data-k="re-${key}" aria-pressed="${v.react[ME.id] === key}">${label}</button>`;

function calendar(s, v) {
  const done = v.pick?.b;
  const same = done && v.prop && v.pick.a === v.prop.a && v.pick.b === v.prop.b;
  const cell = (iso) => day(iso, { act: "e-day", cls: rangeCls(iso, v.prop, "pencil") + rangeCls(iso, v.pick, "pick-on") + tripCls(s, iso) });
  const bar = done
    ? `<div class="bar"><span class="when">${span(v.pick.a, v.pick.b)}, ${nightsOf(v.pick.a, v.pick.b)}</span><span class="bar-acts">` +
      `<button type="button" class="btn" data-act="e-discard" data-k="e-discard">Discard</button>` +
      setBtn(s, v.pick.a, v.pick.b, { quiet: true }) +
      (same ? "" : `<button type="button" class="btn btn-primary" data-act="e-pencil" data-k="e-pencil">${v.prop ? "Pencil this in instead" : "Pencil it in"}</button>`) + `</span></div>`
    : "";
  return `<section class="card"><p class="hint">Press the first day, then the last</p>${cal(s.ym, cell)}` +
    (v.prop ? `<p class="keys"><span class="key"><i class="pencil"></i>Pencilled in</span></p>` : "") + bar + `</section>`;
}

function side(s, v) {
  const head = `<div class="card-head"><h2>Pencilled in</h2></div>`;
  if (!v.prop) return `<section class="card">${head}<p class="hint">Nothing pencilled in yet</p></section>`;
  const { a, b, by } = v.prop;
  const works = who(v, "works");
  const cant = who(v, "cant");
  const rest = PEOPLE.filter((p) => !v.react[p.id]).map((p) => p.id);
  const lines =
    (works.length ? `<p class="line">${faces(works, 20)}<span>Works for ${nameList(works)}</span></p>` : "") +
    RATHER.map(([k, label]) => who(v, k).map((id) => `<p class="line">${faces([id], 20)}<span>${upper(nameOf(id))} would rather it was ${label.toLowerCase()}</span></p>`).join("")).join("") +
    cant.map((id) => `<p class="line">${faces([id], 20)}<span>${upper(nameOf(id))} can't do it</span></p>`).join("");
  return `<section class="card">${head}<div class="stack"><span class="big">${span(a, b)}</span><span class="sub">${nightsOf(a, b)}, from ${nameOf(by)}</span></div>` +
    `<div class="part"><p class="part-title">Your answer</p><div class="picks">${chip(v, "works", "Works for me")}${chip(v, "cant", "Can't do it")}</div>` +
    `<div class="pick-row"><span class="sub">Or rather</span><div class="picks">${RATHER.map(([k, label]) => chip(v, k, label)).join("")}</div></div></div>` +
    `<div class="part"><p class="part-title">The group</p>${lines}${waiting(rest)}<div>${setBtn(s, a, b)}</div></div></section>`;
}

export function view(s) {
  const v = s.E;
  return { rail: rail("The trip"), main: calendar(s, v), side: side(s, v), sideFirst: true };
}

export function act(d, s) {
  const v = s.E;
  if (d.act === "e-day") v.pick = pickRange(v.pick, d.iso);
  if (d.act === "e-discard") v.pick = null;
  if (d.act === "e-react") {
    if (v.react[ME.id] === d.v) delete v.react[ME.id];
    else v.react[ME.id] = d.v;
  }
  if (d.act === "e-pencil" && v.pick?.b) {
    v.prop = { a: v.pick.a, b: v.pick.b, by: ME.id };
    v.react = { [ME.id]: "works" };
    v.pick = null;
  }
}
