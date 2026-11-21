import { bestWindow } from "../availability";
import { addDays, dateRange, formatDate, nightsBetween, type IsoDate } from "../dates";
import { TRIP_LENGTH_SPECS, type LengthChoice } from "./trip-length";
import { countWord } from "../../text/count-word";

export type DayAnswer = { userId: string; date: IsoDate; available: boolean; preferred: boolean };

export type Miss =
  | { kind: "days"; dates: IsoDate[] }
  | { kind: "short"; min: number }
  | { kind: "long"; max: number }
  | { kind: "length"; nights: number };

export type Verdict = { userId: string; works: boolean; prefers: boolean; miss: Miss | null };

export type RankedWindow = {
  start: IsoDate;
  end: IsoDate;
  nights: number;
  works: number;
  total: number;
  prefer: number;
  share: number;
  verdicts: Verdict[];
};

type Span = { min: number; max: number };
type Person = { userId: string; free: Set<IsoDate>; liked: Set<IsoDate>; spans: Span[] };

const SHOWN = 3;
const PER_LENGTH = 2;
const APART = 2;

function peopleOf(days: DayAnswer[], lengths: LengthChoice[]): Person[] {
  const byUser = new Map<string, Person>();
  for (const d of days) {
    if (!d.available) continue;
    const p = byUser.get(d.userId) ?? { userId: d.userId, free: new Set(), liked: new Set(), spans: [] };
    p.free.add(d.date);
    if (d.preferred) p.liked.add(d.date);
    byUser.set(d.userId, p);
  }
  for (const c of lengths) byUser.get(c.userId)?.spans.push(TRIP_LENGTH_SPECS[c.length]);
  return [...byUser.values()];
}

const covers = (s: Span, nights: number) => nights >= s.min && nights <= s.max;

function lengthMiss(p: Person, nights: number): Miss | null {
  if (p.spans.length === 0 || p.spans.some((s) => covers(s, nights))) return null;
  const min = Math.min(...p.spans.map((s) => s.min));
  const max = Math.max(...p.spans.map((s) => s.max));
  if (nights < min) return { kind: "short", min };
  if (nights > max) return { kind: "long", max };
  return { kind: "length", nights };
}

function judge(p: Person, dates: IsoDate[], nights: number): Verdict {
  const missing = dates.filter((d) => !p.free.has(d));
  const miss: Miss | null = missing.length ? { kind: "days", dates: missing } : lengthMiss(p, nights);
  const works = miss === null;
  const liked = dates.filter((d) => p.liked.has(d)).length;
  return {
    userId: p.userId,
    works,
    prefers: works && liked * 2 >= dates.length,
    miss,
  };
}

function weigh(group: Person[], start: IsoDate, nights: number): RankedWindow {
  const dates = dateRange(start, addDays(start, nights));
  const verdicts = group.map((p) => judge(p, dates, nights));
  const liked = group.reduce((n, p) => n + dates.filter((d) => p.liked.has(d)).length, 0);
  return {
    start,
    end: dates[dates.length - 1],
    nights,
    works: verdicts.filter((v) => v.works).length,
    total: group.length,
    prefer: verdicts.filter((v) => v.prefers).length,
    share: liked / dates.length,
    verdicts,
  };
}

function byRank(a: RankedWindow, b: RankedWindow): number {
  return (
    b.works - a.works ||
    b.prefer - a.prefer ||
    b.share - a.share ||
    a.start.localeCompare(b.start) ||
    a.nights - b.nights
  );
}

function spread(sorted: RankedWindow[]): RankedWindow[] {
  const out: RankedWindow[] = [];
  for (const w of sorted) {
    if (out.length === SHOWN) break;
    const same = out.filter((k) => k.nights === w.nights);
    if (same.length < PER_LENGTH && same.every((k) => Math.abs(nightsBetween(k.start, w.start)) > APART)) out.push(w);
  }
  return out;
}

export function bestDates(days: DayAnswer[], lengths: LengthChoice[], from?: IsoDate): RankedWindow[] {
  const group = peopleOf(days, lengths);
  if (group.length === 0) return [];

  const spans = group.flatMap((p) => p.spans);
  if (spans.length === 0) {
    const run = bestWindow(days);
    return run ? [weigh(group, run.start, nightsBetween(run.start, run.end))] : [];
  }

  const lo = Math.min(...spans.map((s) => s.min));
  const hi = Math.max(...spans.map((s) => s.max));
  const starts = [...new Set(group.flatMap((p) => [...p.free]))].filter((d) => !from || d >= from);
  const all: RankedWindow[] = [];
  for (let nights = lo; nights <= hi; nights += 1) {
    if (!spans.some((s) => covers(s, nights))) continue;
    for (const start of starts) {
      const w = weigh(group, start, nights);
      if (w.works > 0) all.push(w);
    }
  }
  return spread(all.sort(byRank));
}

export function windowHeadline(w: RankedWindow): string {
  const nights = countWord(w.nights, "night");
  if (w.total === 1) return `${nights}. 1 person so far.`;
  return `${nights}. ${w.works === w.total ? `All ${w.total}` : `${w.works} of ${w.total}`} can make it.`;
}

function missText(miss: Miss, you: boolean): string {
  const want = you ? "want" : "wants";
  if (miss.kind === "short") return `${want} at least ${countWord(miss.min, "night")}`;
  if (miss.kind === "long") return `${want} at most ${countWord(miss.max, "night")}`;
  if (miss.kind === "length") return `would not do ${countWord(miss.nights, "night")}`;
  const rest = miss.dates.length - 1;
  return `can't do ${formatDate(miss.dates[0])}${rest ? ` and ${countWord(rest, "more day")}` : ""}`;
}

export function windowReasons(w: RankedWindow, nameOf: (userId: string) => string, viewerId?: string | null): string[] {
  const liked = w.prefer ? [`${w.prefer} ${w.prefer === 1 ? "prefers" : "prefer"} these days`] : [];
  const misses = w.verdicts.flatMap((v) => {
    if (!v.miss) return [];
    const you = v.userId === viewerId;
    return [`${you ? "You" : nameOf(v.userId)} ${missText(v.miss, you)}`];
  });
  return [...liked, ...misses];
}
