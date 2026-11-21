import { ico, addDays, dow, monthGrid, monthName, shortDate } from "/_house/kit/trip-frame.mjs";
import { PEOPLE, ME, faces, waiting, span, nightsOf, setBtn, rail } from "./shared.js";

const LENGTHS = [
  { n: 3, label: "Long weekend", from: 4, to: 7 },
  { n: 5, label: "Five nights", from: 2, to: 7 },
  { n: 7, label: "A week", from: -2, to: 5 },
  { n: 10, label: "Ten nights", from: -3, to: 7 },
];

export function seed(group) {
  const empty = Object.fromEntries(PEOPLE.map((p) => [p.id, []]));
  if (group === "none") return { len: { ...empty }, week: { ...empty }, shift: 0 };
  return {
    len: { ...empty, na: [7], me: [5, 7], ca: [5], jo: [7, 10] },
    week: { ...empty, na: ["2027-02-08", "2027-02-15"], me: ["2027-02-15"], ca: ["2027-02-15", "2027-02-22"], jo: ["2027-02-08", "2027-02-15"] },
    shift: 0,
  };
}

const weeksOf = (ym) => monthGrid(ym).map((row) => { const first = row.find(Boolean); return addDays(first, -dow(first)); });
const pickers = (map, key) => PEOPLE.filter((p) => map[p.id].includes(key)).map((p) => p.id);
const voters = (map) => PEOPLE.filter((p) => map[p.id].length).map((p) => p.id);
const top = (keys, map) => keys.map((k) => ({ k, ids: pickers(map, k) })).filter((x) => x.ids.length).sort((x, y) => y.ids.length - x.ids.length)[0] ?? null;
const allWeeks = (v) => [...new Set(Object.values(v.week).flat())].sort();
const toggle = (list, key) => (list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);

function result(v) {
  const len = top(LENGTHS.map((l) => l.n), v.len);
  const week = top(allWeeks(v), v.week);
  if (!len || !week) return { len, week, a: null, b: null };
  const shape = LENGTHS.find((l) => l.n === len.k);
  return { len, week, a: addDays(week.k, shape.from + v.shift), b: addDays(week.k, shape.to + v.shift) };
}

function tile(v, l) {
  const ids = pickers(v.len, l.n);
  return `<button type="button" class="tile" data-act="b-len" data-n="${l.n}" data-k="len-${l.n}" aria-pressed="${ids.includes(ME.id)}">` +
    `<span class="tile-name">${l.label}</span><span class="sub">${l.n} nights</span>` +
    `<span class="tile-who">${faces(ids, 20)}${ids.length ? `<span class="sub">${ids.length}</span>` : ""}</span></button>`;
}

function weekRow(v, w) {
  const ids = pickers(v.week, w);
  const label = `${span(w, addDays(w, 6))}`;
  return `<button type="button" class="wk" role="checkbox" data-act="b-week" data-w="${w}" data-k="wk-${w}" aria-checked="${ids.includes(ME.id)}">` +
    `<span class="box">${ico("check")}</span><span class="when">${label}</span>` +
    `<span class="wk-who">${faces(ids, 20)}${ids.length ? `<span class="sub">${ids.length}</span>` : ""}</span></button>`;
}

function side(s, v) {
  const r = result(v);
  const lenVoters = voters(v.len);
  const weekVoters = voters(v.week);
  const rest = PEOPLE.filter((p) => !lenVoters.includes(p.id) || !weekVoters.includes(p.id)).map((p) => p.id);
  const lenName = r.len ? LENGTHS.find((l) => l.n === r.len.k).label : "";
  const facts =
    `<p class="fact"><span>Length</span>${r.len ? `<b>${lenName}, ${r.len.ids.length} of ${lenVoters.length}</b>` : `<span>Nobody has picked yet</span>`}</p>` +
    `<p class="fact"><span>Week</span>${r.week ? `<b>${shortDate(r.week.k)}, ${r.week.ids.length} of ${weekVoters.length}</b>` : `<span>Nobody has picked yet</span>`}</p>`;
  const out = r.a
    ? `<div class="part"><p class="part-title">Works out as</p><div class="stack"><span class="big">${span(r.a, r.b)}</span><span class="sub">${nightsOf(r.a, r.b)}</span></div>` +
      `<div class="shift"><button type="button" class="btn" data-act="b-shift" data-step="-1" data-k="sh-prev">${ico("chevL")}A day earlier</button>` +
      `<button type="button" class="btn" data-act="b-shift" data-step="1" data-k="sh-next">A day later${ico("chevR")}</button></div>` +
      `<div>${setBtn(s, r.a, r.b)}</div></div>`
    : "";
  return `<section class="card"><div class="card-head"><h2>So far</h2></div>${facts}${waiting(rest)}${out}</section>`;
}

export function view(s) {
  const v = s.B;
  const pager = `<span class="bar-acts"><button type="button" class="iconbtn" data-act="month" data-step="-1" data-k="m-prev" aria-label="Previous month">${ico("chevL")}</button>` +
    `<span class="cal-month nums">${monthName(s.ym)}</span>` +
    `<button type="button" class="iconbtn" data-act="month" data-step="1" data-k="m-next" aria-label="Next month">${ico("chevR")}</button></span>`;
  return {
    rail: rail("Length and week", "Length and week"),
    main:
      `<section class="card"><div class="card-head"><h2>How long?</h2></div><div class="tiles">${LENGTHS.map((l) => tile(v, l)).join("")}</div></section>` +
      `<section class="card"><div class="card-head"><h2>Which week?</h2>${pager}</div><div>${weeksOf(s.ym).map((w) => weekRow(v, w)).join("")}</div></section>`,
    side: side(s, v),
  };
}

export function act(d, s) {
  const v = s.B;
  if (d.act === "b-len") { v.len[ME.id] = toggle(v.len[ME.id], Number(d.n)); v.shift = 0; }
  if (d.act === "b-week") { v.week[ME.id] = toggle(v.week[ME.id], d.w); v.shift = 0; }
  if (d.act === "b-shift") v.shift += Number(d.step);
}
