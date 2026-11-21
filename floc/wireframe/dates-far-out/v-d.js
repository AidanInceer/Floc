import { addDays, dateRange, dow, dom, monthGrid, nights, plural } from "/_house/kit/trip-frame.mjs";
import { PEOPLE, ME, upper, faces, waiting, span, setBtn, rail } from "./shared.js";

const MIN = [3, 4, 5, 6, 7];
const MAX = [4, 5, 6, 7, 8, 10];
const OFF = [2, 3, 4, 5, 6, 99];
const PARTS = [["early", "Early", "1 to 10"], ["mid", "Middle", "11 to 20"], ["late", "Late", "21 on"]];

export function seed(group) {
  const blank = () => ({ min: null, max: null, off: null, parts: [] });
  const ans = Object.fromEntries(PEOPLE.map((p) => [p.id, blank()]));
  if (group === "none") return { ans };
  ans.na = { min: 6, max: 8, off: 5, parts: ["mid"] };
  ans.me = { min: 5, max: 7, off: 5, parts: ["mid", "late"] };
  ans.ca = { min: 4, max: 6, off: 4, parts: ["mid"] };
  ans.jo = { min: 6, max: 10, off: 6, parts: ["early", "mid"] };
  return { ans };
}

const done = (a) => Boolean(a.min && a.max && a.off);
const workDays = (a, n) => dateRange(a, addDays(a, n)).filter((d) => dow(d) < 5).length;
const partOf = (iso) => (dom(iso) <= 10 ? "early" : dom(iso) <= 20 ? "mid" : "late");
function miss(p, a, n, work) {
  const who = p.id === ME.id ? "you want" : `${p.name} wants`;
  const has = p.id === ME.id ? "you have" : `${p.name} has`;
  if (n < a.min) return `${who} at least ${a.min} nights`;
  if (n > a.max) return `${who} at most ${a.max} nights`;
  if (work > a.off) return `${has} ${plural(a.off, "day")} off`;
  return null;
}

function rank(s, v) {
  const answered = PEOPLE.filter((p) => done(v.ans[p.id]));
  if (!answered.length) return { answered, list: [] };
  const lo = Math.min(...answered.map((p) => v.ans[p.id].min));
  const hi = Math.max(...answered.map((p) => v.ans[p.id].max));
  const starts = monthGrid(s.ym).flat().filter(Boolean);
  const all = [];
  for (let n = lo; n <= hi; n++) {
    for (const a of starts) {
      const work = workDays(a, n);
      const misses = answered.map((p) => miss(p, v.ans[p.id], n, work)).filter(Boolean);
      const liked = answered.filter((p) => v.ans[p.id].parts.includes(partOf(a))).length;
      all.push({ a, b: addDays(a, n), n, work, misses, fit: answered.length - misses.length, liked });
    }
  }
  all.sort((x, y) => y.fit - x.fit || y.liked - x.liked || x.work - y.work || y.n - x.n || (x.a < y.a ? -1 : 1));
  const list = [];
  for (const w of all) {
    if (list.length === 4) break;
    if (list.every((k) => k.n !== w.n || Math.abs(nights(k.a, w.a)) > 2)) list.push(w);
  }
  return { answered, list };
}

const chips = (act, values, on, label) => values.map((x) =>
  `<button type="button" class="pick nums" data-act="${act}" data-v="${x}" data-k="${act}-${x}" aria-pressed="${on(x)}">${label ? label(x) : x}</button>`).join("");

function questions(v) {
  const a = v.ans[ME.id];
  return `<section class="card"><div class="card-head"><h2>What suits you</h2></div>` +
    `<div class="part"><p class="part-title">Nights</p>` +
    `<div class="pick-row"><span class="sub">At least</span><div class="picks">${chips("d-min", MIN, (x) => a.min === x)}</div></div>` +
    `<div class="pick-row"><span class="sub">At most</span><div class="picks">${chips("d-max", MAX, (x) => a.max === x)}</div></div></div>` +
    `<div class="part"><p class="part-title">Days off work you can take</p><div class="picks">${chips("d-off", OFF, (x) => a.off === x, (x) => (x === 99 ? "Any" : x))}</div></div>` +
    `<div class="part"><p class="part-title">When in the month</p><div class="picks">${PARTS.map(([k, label, sub]) =>
      `<button type="button" class="pick" data-act="d-part" data-v="${k}" data-k="part-${k}" aria-pressed="${a.parts.includes(k)}">${label}<span class="sub">${sub}</span></button>`).join("")}</div></div>` +
    `</section>`;
}

function results(s, v) {
  const r = rank(s, v);
  const rest = PEOPLE.filter((p) => !r.answered.includes(p)).map((p) => p.id);
  const head = `<div class="card-head"><h2>Best windows</h2>${faces(r.answered.map((p) => p.id), 20)}</div>`;
  if (!r.list.length) return `<section class="card">${head}<p class="hint">No answers yet</p>${waiting(rest)}</section>`;
  const total = r.answered.length;
  const rows = r.list.map((w, i) =>
    `<div class="win"><div class="win-when"><span class="when">${span(w.a, w.b)}</span><span class="sub">${plural(w.n, "night")}, ${plural(w.work, "day")} off work</span></div>` +
    setBtn(s, w.a, w.b, { quiet: i > 0 }) +
    `<div class="win-fit"><b>${w.fit === total ? `Suits all ${total} who answered` : `Suits ${w.fit} of ${total}`}</b>${w.misses.map((m) => `<span>${upper(m)}</span>`).join("")}</div></div>`).join("");
  return `<section class="card">${head}${waiting(rest)}${rows}</section>`;
}

export function view(s) {
  const v = s.D;
  return { rail: rail("What suits you", "What suits you"), main: questions(v), side: results(s, v), wide: true };
}

export function act(d, s) {
  const a = s.D.ans[ME.id];
  const x = Number(d.v);
  if (d.act === "d-min") {
    a.min = a.min === x ? null : x;
    if (a.min && a.max && a.max < a.min) a.max = MAX.find((m) => m >= a.min);
  }
  if (d.act === "d-max") {
    a.max = a.max === x ? null : x;
    if (a.min && a.max && a.min > a.max) a.min = [...MIN].reverse().find((m) => m <= a.max);
  }
  if (d.act === "d-off") a.off = a.off === x ? null : x;
  if (d.act === "d-part") a.parts = a.parts.includes(d.v) ? a.parts.filter((k) => k !== d.v) : [...a.parts, d.v];
}
