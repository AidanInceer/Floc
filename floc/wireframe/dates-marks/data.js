import { addDays, dateRange, formatRange, shortDate, nights as nightsBetween } from "/_house/kit/trip-frame.mjs";

export const ME = { id: "me", name: "Nadia Haddad", initial: "NH", tone: 4 };

export const PEOPLE = [
  ME,
  { id: "dev", name: "Dev Patel", initial: "DP", tone: 1 },
  { id: "jonas", name: "Jonas Berg", initial: "JB", tone: 6 },
  { id: "callum", name: "Callum Reid", initial: "CR", tone: 2 },
  { id: "mei", name: "Mei Tanaka", initial: "MT", tone: 7 },
  { id: "ruth", name: "Ruth Okonkwo", initial: "RO", tone: 3 },
];

const feb = (a, b) => dateRange(`2027-02-${String(a).padStart(2, "0")}`, `2027-02-${String(b).padStart(2, "0")}`);

const OTHERS = {
  dev: { free: feb(1, 28), prefer: feb(12, 15), lengths: ["week"] },
  jonas: { free: feb(10, 28), prefer: feb(24, 28), lengths: ["short_break"] },
  callum: { free: [...feb(5, 16), ...feb(20, 28)], prefer: feb(20, 23), lengths: ["short_break", "week"] },
  mei: { free: [...feb(1, 9), ...feb(19, 28)], prefer: feb(24, 27), lengths: ["long_weekend", "short_break"] },
  ruth: { free: feb(8, 28), prefer: [], lengths: ["week"] },
};

export const ANSWERED = { some: ["me", "dev", "jonas"], all: PEOPLE.map((p) => p.id) };

export const LENGTHS = [
  { key: "long_weekend", label: "Long weekend", nights: "2–3 nights", min: 2, max: 3 },
  { key: "short_break", label: "Short break", nights: "4–5 nights", min: 4, max: 5 },
  { key: "week", label: "A week", nights: "6–8 nights", min: 6, max: 8 },
  { key: "longer", label: "Longer", nights: "9+ nights", min: 9, max: 14 },
];

export function seedMine() {
  const marks = new Map();
  for (const d of [...feb(1, 21), ...feb(24, 28)]) marks.set(d, "free");
  for (const d of [...feb(5, 8), ...feb(24, 26)]) marks.set(d, "prefer");
  return marks;
}

export const markOf = (s, d) => (s.edits.has(d) ? s.edits.get(d) : s.saved.get(d) ?? "off");

function personOf(s, id) {
  if (id === "me") {
    const free = new Set(), prefer = new Set();
    for (const d of feb(1, 28)) {
      const m = markOf(s, d);
      if (m !== "off") free.add(d);
      if (m === "prefer") prefer.add(d);
    }
    return { id, free, prefer, lengths: [...s.lengths] };
  }
  const o = OTHERS[id];
  return { id, free: new Set(o.free), prefer: new Set(o.prefer), lengths: o.lengths };
}

export const answeredIds = (s) => ANSWERED[s.group];
export const group = (s) => answeredIds(s).map((id) => personOf(s, id)).filter((p) => p.free.size > 0);

export function tallies(s) {
  const ppl = group(s);
  const out = {};
  for (const d of feb(1, 28)) {
    out[d] = { free: ppl.filter((p) => p.free.has(d)).length, prefer: ppl.filter((p) => p.prefer.has(d)).length };
  }
  return out;
}

export function fillKey(free, total) {
  if (!free) return "";
  if (free === total) return "all";
  const r = free / total;
  return r <= 1 / 3 ? "s1" : r <= 2 / 3 ? "s2" : "s3";
}

const spec = (key) => LENGTHS.find((l) => l.key === key);
const covers = (p, n) => p.lengths.length === 0 || p.lengths.some((k) => n >= spec(k).min && n <= spec(k).max);

export function bestWindows(s) {
  const ppl = group(s);
  if (!ppl.length) return [];
  const all = new Set(ppl.flatMap((p) => p.lengths));
  const keys = all.size ? [...all] : ["short_break"];
  const lo = Math.min(...keys.map((k) => spec(k).min));
  const hi = Math.max(...keys.map((k) => spec(k).max));
  const found = [];
  for (let n = lo; n <= hi; n += 1) {
    if (!keys.some((k) => n >= spec(k).min && n <= spec(k).max)) continue;
    for (const start of feb(1, 28)) {
      const end = addDays(start, n);
      if (end > "2027-02-28") continue;
      const days = dateRange(start, end);
      const works = ppl.filter((p) => days.every((d) => p.free.has(d)) && covers(p, n));
      if (!works.length) continue;
      const prefer = works.filter((p) => days.filter((d) => p.prefer.has(d)).length * 2 >= days.length);
      const share = ppl.reduce((t, p) => t + days.filter((d) => p.prefer.has(d)).length, 0) / days.length;
      found.push({ start, end, n, days, works: works.length, total: ppl.length, prefer: prefer.length, share, ppl });
    }
  }
  found.sort((a, b) => b.works - a.works || b.prefer - a.prefer || b.share - a.share || a.start.localeCompare(b.start) || a.n - b.n);
  const out = [];
  for (const w of found) {
    if (out.length === 3) break;
    const same = out.filter((k) => k.n === w.n);
    if (same.length < 2 && same.every((k) => Math.abs(nightsBetween(k.start, w.start)) > 2)) out.push(w);
  }
  return out;
}

const nameOf = (id) => (id === "me" ? "You" : PEOPLE.find((p) => p.id === id).name);

export function reasons(w) {
  const lines = w.prefer ? [`${w.prefer} ${w.prefer === 1 ? "prefers" : "prefer"} these days`] : [];
  for (const p of w.ppl) {
    const missing = w.days.filter((d) => !p.free.has(d));
    const you = p.id === "me";
    if (missing.length) lines.push(`${nameOf(p.id)} can't do ${shortDate(missing[0])}${missing.length > 1 ? ` and ${missing.length - 1} more` : ""}`);
    else if (!covers(p, w.n)) {
      const min = Math.min(...p.lengths.map((k) => spec(k).min));
      lines.push(`${nameOf(p.id)} ${you ? "want" : "wants"} ${w.n < min ? `at least ${min}` : `at most ${Math.max(...p.lengths.map((k) => spec(k).max))}`} nights`);
    }
  }
  return lines.slice(0, 3);
}

export const headline = (w) => `${w.n} nights. ${w.works === w.total ? `All ${w.total}` : `${w.works} of ${w.total}`} can make it.`;
export const span = formatRange;

const SKY = ["sun", "part", "cloud", "part", "sun", "rain", "part"];
export function forecast(day) {
  const n = Number(day.slice(8, 10));
  return { sky: SKY[n % SKY.length], hi: -2 + ((n * 7) % 9), lo: -9 + ((n * 5) % 6) };
}
export const SKY_WORD = { sun: "Sunny", part: "Some sun", cloud: "Cloudy", rain: "Snow showers" };
