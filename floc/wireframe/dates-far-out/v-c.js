import { addDays, dateRange, monthGrid, nights } from "/_house/kit/trip-frame.mjs";
import { PEOPLE, ME, nameList, waiting, span, nightsOf, cal, day, tripCls, setBtn, rail } from "./shared.js";

const NIGHTS = [3, 4, 5, 6, 7, 8, 9, 10];
const STAR = `<svg class="g mark" viewBox="0 0 14 14" aria-hidden="true"><path d="M7 1.9 8.6 5.2 12.2 5.7 9.6 8.2 10.2 11.8 7 10.1 3.8 11.8 4.4 8.2 1.8 5.7 5.4 5.2Z"/></svg>`;

export function seed(group) {
  const sets = () => Object.fromEntries(PEOPLE.map((p) => [p.id, new Set()]));
  const v = { tab: "Your days", mode: "can", can: sets(), prefer: sets(), nights: {}, value: true };
  if (group === "none") return v;
  const feb = dateRange("2027-02-01", "2027-02-28");
  v.can.na = new Set(feb);
  v.can.me = new Set(feb);
  v.can.jo = new Set(feb);
  v.can.ca = new Set(dateRange("2027-02-06", "2027-02-28"));
  v.prefer.na = new Set(dateRange("2027-02-13", "2027-02-20"));
  v.prefer.me = new Set(dateRange("2027-02-12", "2027-02-21"));
  v.prefer.ca = new Set(dateRange("2027-02-17", "2027-02-21"));
  v.prefer.jo = new Set(dateRange("2027-02-06", "2027-02-14"));
  v.nights = { na: 7, me: 7, ca: 4, jo: 7 };
  return v;
}

function paint(v, iso, value) {
  const can = v.can[ME.id];
  const prefer = v.prefer[ME.id];
  if (v.mode === "can") {
    if (value) can.add(iso);
    else { can.delete(iso); prefer.delete(iso); }
  } else if (value) { can.add(iso); prefer.add(iso); } else prefer.delete(iso);
}
const isOn = (v, iso) => (v.mode === "can" ? v.can[ME.id] : v.prefer[ME.id]).has(iso);

function fits(v) {
  const answered = PEOPLE.filter((p) => v.can[p.id].size);
  const ns = Object.values(v.nights).filter(Boolean).sort((a, b) => a - b);
  if (!answered.length || !ns.length) return { answered, n: null, list: [] };
  const n = ns[Math.floor((ns.length - 1) / 2)];
  const starts = [...new Set(answered.flatMap((p) => [...v.can[p.id]]))].sort();
  const ranked = starts.map((a) => {
    const days = dateRange(a, addDays(a, n));
    const free = answered.filter((p) => days.every((d) => v.can[p.id].has(d)));
    const liked = answered.map((p) => days.filter((d) => v.prefer[p.id].has(d)).length);
    return { a, b: addDays(a, n), free: free.length, prefer: liked.filter((k) => k * 2 >= days.length).length, total: liked.reduce((x, y) => x + y, 0) };
  }).filter((w) => w.free > 0).sort((x, y) => y.free - x.free || y.total - x.total || (x.a < y.a ? -1 : 1));
  const list = [];
  for (const w of ranked) {
    if (list.length === 3) break;
    if (list.every((k) => Math.abs(nights(k.a, w.a)) >= 3)) list.push(w);
  }
  return { answered, n, list };
}

function nightsPart(v) {
  const groups = NIGHTS.map((n) => ({ n, ids: PEOPLE.filter((p) => p.id !== ME.id && v.nights[p.id] === n).map((p) => p.id) })).filter((x) => x.ids.length);
  const said = groups.map((x) => `${nameList(x.ids)}: ${x.n}`).join(", ");
  return `<div class="part"><p class="part-title">How many nights?</p><div class="picks">${NIGHTS.map((n) =>
    `<button type="button" class="pick nums" data-act="c-nights" data-n="${n}" data-k="n-${n}" aria-pressed="${v.nights[ME.id] === n}">${n}</button>`).join("")}</div>` +
    (said ? `<p class="sub">${said}</p>` : "") + `</div>`;
}

function mine(s, v) {
  const cell = (iso) => {
    const prefer = v.prefer[ME.id].has(iso);
    const can = v.can[ME.id].has(iso);
    return day(iso, { act: "c-day", paint: true, pressed: isOn(v, iso), cls: (prefer ? "prefer" : can ? "can" : "") + tripCls(s, iso), label: prefer ? "you prefer" : can ? "you can do" : "", extra: prefer ? STAR : "" });
  };
  return `<section class="card"><div class="card-head"><div class="track" role="group" aria-label="What a press marks">` +
    `<button type="button" data-act="c-mode" data-v="can" data-k="mode-can" aria-pressed="${v.mode === "can"}">Can do</button>` +
    `<button type="button" data-act="c-mode" data-v="prefer" data-k="mode-prefer" aria-pressed="${v.mode === "prefer"}">Prefer</button></div>` +
    `<button type="button" class="btn" data-act="c-all" data-k="c-all">Free all month</button></div>` +
    cal(s.ym, cell) +
    `<p class="keys"><span class="key"><i class="can"></i>You can do</span><span class="key"><i class="prefer"></i>You prefer</span></p>` +
    nightsPart(v) + `</section>`;
}

function group(s, v) {
  const cell = (iso) => {
    const k = PEOPLE.filter((p) => v.prefer[p.id].has(iso)).length;
    return day(iso, { still: true, cls: (k >= 3 ? "heat-2" : k ? "heat-1" : "") + tripCls(s, iso), label: `${k} prefer`, extra: k ? `<span class="n">${k}</span>` : "" });
  };
  return `<section class="card">${cal(s.ym, cell)}` +
    `<p class="keys"><span class="key"><i class="heat-1"></i>1 or 2 prefer</span><span class="key"><i class="heat-2"></i>3 or more prefer</span></p></section>`;
}

function side(s, v) {
  const f = fits(v);
  const rest = PEOPLE.filter((p) => !f.answered.includes(p)).map((p) => p.id);
  const head = `<div class="card-head"><h2>Best fit</h2></div>`;
  if (!f.answered.length) return `<section class="card">${head}<p class="hint">No days marked yet</p></section>`;
  if (!f.n) return `<section class="card">${head}<p class="hint">Pick how many nights to see the best fit</p>${waiting(rest)}</section>`;
  const all = f.answered.length;
  const line = (w) => `${w.free === all ? `All ${all} who answered can do it` : `${w.free} of ${all} can do it`}${w.prefer ? `, ${w.prefer} prefer it` : ""}`;
  const [first, ...more] = f.list;
  if (!first) return `<section class="card">${head}<p class="hint">No run of ${f.n} nights that anyone can do</p>${waiting(rest)}</section>`;
  return `<section class="card">${head}<div class="stack"><span class="big">${span(first.a, first.b)}</span><span class="sub">${nightsOf(first.a, first.b)}</span></div>` +
    `<p class="hint">${line(first)}</p>${waiting(rest)}<div>${setBtn(s, first.a, first.b, { label: "Use these" })}</div>` +
    more.map((w) => `<div class="win"><div class="win-when"><span class="when">${span(w.a, w.b)}</span><span class="sub">${line(w)}</span></div>${setBtn(s, w.a, w.b, { label: "Use these", quiet: true })}</div>`).join("") +
    `</section>`;
}

export function view(s) {
  const v = s.C;
  return {
    rail: rail(v.tab, null, ["Your days", "The group"]),
    main: v.tab === "The group" ? group(s, v) : mine(s, v),
    side: side(s, v),
  };
}

export function act(d, s) {
  const v = s.C;
  if (d.act === "tab") v.tab = d.tab;
  if (d.act === "c-mode") v.mode = d.v;
  if (d.act === "c-nights") v.nights[ME.id] = v.nights[ME.id] === Number(d.n) ? null : Number(d.n);
  if (d.act === "c-all") monthGrid(s.ym).flat().filter(Boolean).forEach((iso) => v.can[ME.id].add(iso));
  if (d.act === "c-day") {
    if (d.start) v.value = !isOn(v, d.iso);
    paint(v, d.iso, v.value);
  }
}
