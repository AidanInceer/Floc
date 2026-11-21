import { ico, addDays, dateRange, monthGrid, nights, plural, shortDate } from "/_house/kit/trip-frame.mjs";
import { PEOPLE, ME, nameOf, upper, faces, waiting, span, cal, day, tripCls, setBtn } from "./shared.js";

export const NIGHTS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const STAR_PATH = `<path d="M7 1.9 8.6 5.2 12.2 5.7 9.6 8.2 10.2 11.8 7 10.1 3.8 11.8 4.4 8.2 1.8 5.7 5.4 5.2Z"/>`;
export const STAR = `<svg class="g mark" viewBox="0 0 14 14" aria-hidden="true">${STAR_PATH}</svg>`;
const STAR_INLINE = `<svg class="g" viewBox="0 0 14 14" aria-hidden="true">${STAR_PATH}</svg>`;
const MINUS = `<svg class="g" viewBox="0 0 14 14" aria-hidden="true"><path d="M2.8 7h8.4"/></svg>`;
export const HOW = "Ranked by who can make every day, then the days most people prefer, then the length most people want.";
const TILES = [
  { k: "a", label: "Long weekend", sub: "2 or 3 nights", brief: "2–3 nights", lo: 2, hi: 3 },
  { k: "b", label: "Short break", sub: "4 or 5 nights", brief: "4–5 nights", lo: 4, hi: 5 },
  { k: "c", label: "A week", sub: "6 to 8 nights", brief: "6–8 nights", lo: 6, hi: 8 },
  { k: "d", label: "Longer", sub: "9 nights or more", brief: "9+ nights", lo: 9, hi: 14 },
];

const feb = (a, b) => dateRange(`2027-02-${String(a).padStart(2, "0")}`, `2027-02-${String(b).padStart(2, "0")}`);
const between = (lo, hi) => new Set(NIGHTS.filter((n) => n >= lo && n <= hi));

export function seed(group) {
  const R = {
    mode: "can",
    value: true,
    can: Object.fromEntries(PEOPLE.map((p) => [p.id, new Set()])),
    prefer: Object.fromEntries(PEOPLE.map((p) => [p.id, new Set()])),
    len: Object.fromEntries(PEOPLE.map((p) => [p.id, { can: new Set(), like: new Set() }])),
  };
  const put = (id, can, prefer, lo, hi, ideal) => {
    R.can[id] = new Set(can.flatMap(([a, b]) => feb(a, b)));
    R.prefer[id] = new Set(prefer.flatMap(([a, b]) => feb(a, b)));
    R.len[id] = { can: between(lo, hi), like: new Set([ideal]) };
  };
  if (group === "open") {
    put("na", [[1, 28]], [[13, 20]], 6, 8, 7);
    put("me", [[1, 28]], [[12, 21]], 5, 7, 7);
    put("ca", [[6, 28]], [[17, 21]], 4, 6, 5);
    put("jo", [[1, 28]], [[6, 14]], 6, 10, 7);
  }
  if (group === "busy") {
    put("na", [[5, 7], [12, 21], [26, 28]], [[13, 16]], 3, 5, 4);
    put("me", [[6, 15], [19, 22]], [[12, 14]], 2, 4, 3);
    put("ca", [[12, 15], [19, 21]], [[19, 21]], 2, 3, 2);
    put("jo", [[1, 9], [12, 20]], [[13, 15]], 3, 7, 4);
    put("ru", [[13, 16], [20, 28]], [[13, 15]], 2, 4, 3);
  }
  return R;
}

export const done = (R, id) => ({ len: R.len[id].can.size > 0, days: R.can[id].size > 0, prefer: R.prefer[id].size > 0 });
const isIn = (R, id) => done(R, id).len && done(R, id).days;
export const inCount = (R) => PEOPLE.filter((p) => isIn(R, p.id)).length;
export const notIn = (R) => PEOPLE.filter((p) => !isIn(R, p.id)).map((p) => p.id);

export function lenOf(R, id) {
  const can = [...R.len[id].can].sort((a, b) => a - b);
  const like = [...R.len[id].like].sort((a, b) => a - b);
  return { min: can[0] ?? null, max: can[can.length - 1] ?? null, ideal: like[0] ?? null };
}
export function lenText(R, id) {
  const { min, max, ideal } = lenOf(R, id);
  if (min === null) return "";
  if (min === max) return plural(min, "night");
  return `${min} to ${max} nights${ideal ? `, ideally ${ideal}` : ""}`;
}
export function daysText(R, id) {
  const can = R.can[id].size;
  if (!can) return "";
  return `${plural(can, "day")}${R.prefer[id].size ? `, ${R.prefer[id].size} preferred` : ""}`;
}
function lenTally(R) {
  const answered = PEOPLE.filter((p) => R.len[p.id].can.size).length;
  if (!answered) return null;
  const rows = NIGHTS.map((n) => ({
    n,
    can: PEOPLE.filter((p) => R.len[p.id].can.has(n)).length,
    like: PEOPLE.filter((p) => R.len[p.id].like.has(n)).length,
  }));
  const best = rows.reduce((x, y) => (y.can > x.can ? y : x));
  const fav = rows.reduce((x, y) => (y.like > x.like ? y : x));
  return { answered, best, fav, suits: best.can === answered ? `all ${answered}` : `${best.can} of ${answered}` };
}
export function lenGroup(R) {
  const t = lenTally(R);
  if (!t) return "";
  return `${plural(t.best.n, "night")} suits ${t.suits} so far` +
    (t.fav.like ? `. ${plural(t.fav.n, "night")} is the favourite, picked by ${t.fav.like}.` : ".");
}
export function lenBrief(R) {
  const t = lenTally(R);
  if (!t) return "";
  return `${plural(t.best.n, "night")} suits ${t.suits}.` + (t.fav.like && t.fav.n !== t.best.n ? ` ${t.fav.n} is the favourite.` : "");
}

function setRange(R, a, b, ideal) {
  const lo = Math.max(2, Math.min(a, b));
  const hi = Math.min(14, Math.max(a, b));
  R.len[ME.id] = { can: between(lo, hi), like: ideal ? new Set([Math.min(hi, Math.max(lo, ideal))]) : new Set() };
}

const listDays = (list) =>
  list.length === 1 ? shortDate(list[0]) : list.length === 2 ? `${shortDate(list[0])} and ${shortDate(list[1])}` : `${shortDate(list[0])} and ${list.length - 1} more days`;

function judge(R, p, a, n) {
  const days = dateRange(a, addDays(a, n));
  const hasDays = R.can[p.id].size > 0;
  const hasLen = R.len[p.id].can.size > 0;
  const missing = hasDays ? days.filter((d) => !R.can[p.id].has(d)) : [];
  const liked = days.filter((d) => R.prefer[p.id].has(d)).length;
  const lenOk = !hasLen || R.len[p.id].can.has(n);
  const ideal = R.len[p.id].like.has(n);
  const works = hasDays && !missing.length && lenOk;
  const prefers = works && liked * 2 >= days.length;
  const { min, max } = lenOf(R, p.id);
  const want = p.id === ME.id ? "want" : "wants";
  let miss = "";
  let short = "";
  if (!hasDays) { miss = ""; short = hasLen ? "No days yet" : "No answer yet"; }
  else if (missing.length) { miss = `can't do ${listDays(missing)}`; short = `Not ${shortDate(missing[0])}${missing.length > 1 ? ` and ${missing.length - 1} more` : ""}`; }
  else if (!lenOk) {
    miss = n < min ? `${want} at least ${min} nights` : n > max ? `${want} at most ${max} nights` : `would not do ${n} nights`;
    short = n < min ? "Too short" : n > max ? "Too long" : "Not this length";
  } else short = [prefers ? "Prefers" : "Can do", ideal ? "ideal length" : ""].filter(Boolean).join(", ");
  const text = works ? [prefers ? "Free, prefers these days" : "Free", ideal ? "ideal length" : ""].filter(Boolean).join(", ") : miss ? upper(miss) : short;
  return { p, hasDays, works, prefers, liked, ideal, miss, short, text };
}

export function rank(R) {
  const dayers = PEOPLE.filter((p) => R.can[p.id].size);
  const lengths = NIGHTS.filter((n) => PEOPLE.some((p) => R.len[p.id].can.has(n)));
  if (!dayers.length || !lengths.length) return { dayers, lengths, list: [] };
  const starts = [...new Set(dayers.flatMap((p) => [...R.can[p.id]]))].sort();
  const all = [];
  for (const n of lengths) {
    for (const a of starts) {
      const who = PEOPLE.map((p) => judge(R, p, a, n));
      const works = who.filter((j) => j.works).length;
      if (!works) continue;
      all.push({
        a, b: addDays(a, n), n, who, works,
        like: who.filter((j) => j.prefers).length,
        ideal: who.filter((j) => j.works && j.ideal).length,
        liked: who.reduce((x, j) => x + j.liked, 0) / (n + 1),
      });
    }
  }
  all.sort((x, y) => y.works - x.works || y.like - x.like || y.ideal - x.ideal || y.liked - x.liked || (x.a < y.a ? -1 : x.a > y.a ? 1 : 0));
  const list = [];
  for (const w of all) {
    if (list.length === 5) break;
    const same = list.filter((k) => k.n === w.n);
    if (same.length < 2 && same.every((k) => Math.abs(nights(k.a, w.a)) > 2)) list.push(w);
  }
  return { dayers, lengths, list };
}
export const winKey = (w) => `${w.a}|${w.n}`;
export const facts = (w, total) => [
  w.works === total ? `All ${total} can make it` : `${w.works} of ${total} can make it`,
  w.like ? `${w.like} prefer these days` : "",
  w.ideal ? `ideal length for ${w.ideal}` : "",
].filter(Boolean);
export const misses = (w) => w.who.filter((j) => j.miss).map((j) => `${upper(nameOf(j.p.id))} ${j.miss}`);

export function bestRow(s, w, total, o = {}) {
  const miss = misses(w).map((m) => `<span>${m}</span>`).join("");
  return `<div class="bw"><div class="bw-head"><span class="when">${span(w.a, w.b)}</span><span class="sub">${plural(w.n, "night")}</span>${o.first ? `<span class="badge">Best</span>` : ""}</div>` +
    `<p class="bw-facts">${facts(w, total).map((f) => `<span>${f}</span>`).join("")}</p>` +
    (miss ? `<p class="bw-miss">${miss}</p>` : "") +
    (o.noSet ? "" : `<div>${setBtn(s, w.a, w.b, { quiet: !o.first })}</div>`) + `</div>`;
}
export function missing(R, r) {
  if (!r.dayers.length) return "No days marked yet";
  if (!r.lengths.length) return "Nobody has said how long yet";
  if (!r.list.length) return "No dates anyone can do for those lengths";
  return "";
}
export function bestBody(s, R, o = {}) {
  const r = rank(R);
  const gap = missing(R, r);
  if (gap) return `<p class="hint">${gap}</p>${waiting(notIn(R))}`;
  return (o.how ? `<p class="hint">${HOW}</p>` : "") + waiting(notIn(R)) +
    r.list.slice(0, o.limit ?? 3).map((w, i) => bestRow(s, w, r.dayers.length, { first: i === 0, noSet: o.noSet })).join("");
}

export function whoRows(R) {
  const st = (on, word) => `<span class="st${on ? " on" : ""}">${on ? ico("check") : ""}${word}${on ? "" : " to do"}</span>`;
  return PEOPLE.map((p) => {
    const d = done(R, p.id);
    return `<div class="who-row">${faces([p.id], 22)}<span class="name">${p.id === ME.id ? "You" : p.name}</span>${st(d.len, "Length")}${st(d.days, "Days")}</div>`;
  }).join("");
}
export const whoCard = (R) => `<section class="card"><div class="card-head"><h2>Who's in</h2><span class="sub">${inCount(R)} of ${PEOPLE.length}</span></div><div>${whoRows(R)}</div></section>`;

export function lenStrip(R) {
  const me = R.len[ME.id];
  return `<div class="strip" role="group" aria-label="Nights">${NIGHTS.map((n) => {
    const st = me.like.has(n) ? "prefer" : me.can.has(n) ? "can" : "";
    const label = `${plural(n, "night")}${st === "prefer" ? ", you prefer" : st === "can" ? ", you can do" : ""}`;
    return `<button type="button" class="nt ${st}" data-act="r-len" data-n="${n}" data-k="nt-${n}" aria-label="${label}">${n}${st === "prefer" ? STAR : ""}</button>`;
  }).join("")}</div>`;
}
export function lenTiles(R, o = {}) {
  const me = R.len[ME.id];
  return `<div class="qtiles">${TILES.map((t) => {
    const ns = NIGHTS.filter((n) => n >= t.lo && n <= t.hi);
    const st = ns.some((n) => me.like.has(n)) ? "prefer" : ns.some((n) => me.can.has(n)) ? "can" : "";
    const can = PEOPLE.filter((p) => ns.some((n) => R.len[p.id].can.has(n))).length;
    const like = PEOPLE.filter((p) => ns.some((n) => R.len[p.id].like.has(n))).length;
    const count = can ? `${can} can${like ? `, ${like} prefer` : ""}` : "";
    const label = `${t.label}, ${t.sub}${st === "prefer" ? ", you prefer" : st === "can" ? ", you can do" : ""}`;
    return `<button type="button" class="qtile ${st}${o.brief ? " brief" : ""}" data-act="r-tile" data-t="${t.k}" data-k="qt-${t.k}" aria-label="${label}">` +
      `<span class="qtile-name">${t.label}</span><span class="sub">${o.brief ? t.brief : t.sub}</span>${o.brief ? "" : `<span class="sub count">${count}</span>`}${st === "prefer" ? STAR : ""}</button>`;
  }).join("")}</div>`;
}
export function lenSentence(R) {
  const { min, max, ideal } = lenOf(R, ME.id);
  const stepper = (field, value, label) =>
    `<span class="stepper" role="group" aria-label="${label}"><button type="button" data-act="r-step" data-field="${field}" data-step="-1" data-k="st-${field}-d" aria-label="Fewer">${MINUS}</button>` +
    `<span class="nums">${value ?? "–"}</span><button type="button" data-act="r-step" data-field="${field}" data-step="1" data-k="st-${field}-u" aria-label="More">${ico("plus")}</button></span>`;
  return `<p class="sentence"><span>You can do</span>${stepper("min", min, "Fewest nights")}<span>to</span>${stepper("max", max, "Most nights")}<span>nights, ideally</span>${stepper("ideal", ideal, "Ideal nights")}</p>`;
}
export function lenRows(R) {
  const { min, max, ideal } = lenOf(R, ME.id);
  const row = (label, field, values, cur) =>
    `<div class="pick-row"><span class="sub">${label}</span><div class="picks">${values.map((x) =>
      `<button type="button" class="pick nums" data-act="r-pick" data-field="${field}" data-v="${x}" data-k="pk-${field}-${x}" aria-pressed="${cur === x}">${x}</button>`).join("")}</div></div>`;
  const ideals = min === null ? [3, 4, 5, 6, 7, 8] : NIGHTS.filter((n) => n >= min && n <= max).slice(0, 9);
  return row("At least", "min", [2, 3, 4, 5, 6, 7, 8], min) + row("At most", "max", [3, 4, 5, 6, 7, 8, 10, 14], max) + row("Ideally", "ideal", ideals, ideal);
}

export const MARK_KEYS = `<p class="keys"><span class="key"><i class="can"></i>You can do</span><span class="key"><i class="prefer"></i>You prefer</span></p>`;
export function modeTrack(R) {
  const b = (v, label) => `<button type="button" data-act="r-mode" data-v="${v}" data-k="mode-${v}" aria-pressed="${R.mode === v}">${label}</button>`;
  return `<div class="track" role="group" aria-label="What a press marks">${b("can", "Can do")}${b("prefer", "Prefer")}</div>`;
}
export const FILL = `<button type="button" class="btn" data-act="r-fill" data-k="r-fill">Free all month</button>`;
export const CLEAR = `<button type="button" class="btn" data-act="r-clear" data-k="r-clear">Clear my days</button>`;

export function myDays(s, R, fixed, sel) {
  const can = R.can[ME.id];
  const prefer = R.prefer[ME.id];
  const mode = fixed || R.mode;
  return cal(s.ym, (iso) => {
    const p = prefer.has(iso);
    const c = can.has(iso);
    return day(iso, {
      act: "r-day", paint: true, mode: fixed, pressed: mode === "prefer" ? p : c,
      cls: (p ? "prefer" : c ? "can" : "") + (sel && iso >= sel.a && iso <= sel.b ? " sel" : "") + tripCls(s, iso), label: p ? "you prefer" : c ? "you can do" : "", extra: p ? STAR : "",
    });
  });
}

export function groupDays(s, R, o = {}) {
  const dayers = PEOPLE.filter((p) => R.can[p.id].size);
  const total = dayers.length;
  return cal(s.ym, (iso) => {
    const free = dayers.filter((p) => R.can[p.id].has(iso)).length;
    const like = PEOPLE.filter((p) => R.prefer[p.id].has(iso)).length;
    const heat = !total || !free ? "" : free === total ? "all" : `some-${Math.max(1, Math.ceil((free / total) * 3))}`;
    const mine = o.mine && R.can[ME.id].has(iso);
    const cls = heat + (mine ? " mine" : "") + (o.sel && iso >= o.sel.a && iso <= o.sel.b ? " sel" : "") + tripCls(s, iso);
    const extra = like ? `<span class="pc">${STAR_INLINE}${like}</span>` : "";
    const label = total ? `${free} of ${total} free${like ? `, ${like} prefer` : ""}${mine ? ", you can do" : ""}` : "";
    return o.mine ? day(iso, { act: "r-day", paint: true, cls, label, extra, pressed: R.mode === "prefer" ? R.prefer[ME.id].has(iso) : R.can[ME.id].has(iso) }) : day(iso, { still: true, cls, label, extra });
  });
}
export const groupKeys = (mine) =>
  `<p class="keys"><span class="key"><i class="all"></i>Everyone free</span><span class="key"><i class="some-2"></i>Some free</span>` +
  `<span class="key">${STAR_INLINE}People who prefer it</span>${mine ? `<span class="key"><i class="mine"></i>You can do</span>` : ""}</p>`;

const has = (R, mode, iso) => (mode === "prefer" ? R.prefer[ME.id] : R.can[ME.id]).has(iso);
function mark(R, mode, iso, value) {
  const can = R.can[ME.id];
  const prefer = R.prefer[ME.id];
  if (mode === "prefer") {
    if (value) { can.add(iso); prefer.add(iso); } else prefer.delete(iso);
  } else if (value) can.add(iso);
  else { can.delete(iso); prefer.delete(iso); }
}

export function act(d, s) {
  const R = s.R;
  const me = R.len[ME.id];
  const { min, max, ideal } = lenOf(R, ME.id);
  if (d.act === "r-mode") R.mode = d.v;
  if (d.act === "r-day") {
    const mode = d.mode || R.mode;
    if (d.start) R.value = !has(R, mode, d.iso);
    mark(R, mode, d.iso, R.value);
  }
  if (d.act === "r-fill") monthGrid(s.ym).flat().filter(Boolean).forEach((iso) => R.can[ME.id].add(iso));
  if (d.act === "r-clear") { R.can[ME.id].clear(); R.prefer[ME.id].clear(); }
  if (d.act === "r-len") {
    const n = Number(d.n);
    if (me.like.has(n)) { me.like.delete(n); me.can.delete(n); } else if (me.can.has(n)) me.like.add(n); else me.can.add(n);
  }
  if (d.act === "r-tile") {
    const t = TILES.find((x) => x.k === d.t);
    const ns = NIGHTS.filter((n) => n >= t.lo && n <= t.hi);
    if (ns.some((n) => me.like.has(n))) ns.forEach((n) => { me.like.delete(n); me.can.delete(n); });
    else if (ns.some((n) => me.can.has(n))) ns.forEach((n) => { me.can.add(n); me.like.add(n); });
    else ns.forEach((n) => me.can.add(n));
  }
  if (d.act === "r-step") {
    const step = Number(d.step);
    if (min === null) setRange(R, 4, 4, d.field === "ideal" ? 4 : null);
    else if (d.field === "min") setRange(R, Math.max(2, Math.min(max, min + step)), max, ideal);
    else if (d.field === "max") setRange(R, min, Math.min(14, Math.max(min, max + step)), ideal);
    else setRange(R, min, max, ideal === null ? min : Math.min(max, Math.max(min, ideal + step)));
  }
  if (d.act === "r-pick") {
    const v = Number(d.v);
    if (d.field === "min") {
      if (min === v && max === v) R.len[ME.id] = { can: new Set(), like: new Set() };
      else setRange(R, v, Math.max(v, max ?? v), ideal);
    }
    if (d.field === "max") setRange(R, Math.min(min ?? v, v), v, ideal);
    if (d.field === "ideal") {
      if (ideal === v) me.like = new Set();
      else setRange(R, Math.min(min ?? v, v), Math.max(max ?? v, v), v);
    }
  }
}
