import type { ReactNode } from "react";

import { dayMark, markKey, weekJoins } from "@floc/core/dates/day-marks";
import { groupTab, spanLabel, tripTab, yourDaysTab, type TabSummary } from "@floc/core/dates/dates-tabs";
import { ArrowUpIcon, CheckIcon, ChevronIcon, CrossIcon } from "@/components/system/icons";
import { NavGlyph } from "@/components/system/icons/nav";
import { Avatar, LegendKey, cx } from "@/components/system/ui";
import { SortCubes } from "@/components/trip/overview/sort/sort-cubes";

import { alex, jo, kit, priya, sam, maya, you } from "../sample-trip";
import { FakeButton, PageHead } from "./screen-frame";

const IDEAS = [
  { title: "Sicily: food, beaches, one flight", by: priya, votes: 5, mine: true },
  { title: "Sardinia, for the quieter sea", by: kit, votes: 2, mine: false },
  { title: "Puglia, cheap in September", by: jo, votes: 1, mine: false },
  { title: "Lisbon and the coast", by: alex, votes: 1, mine: false },
];

function SortStrip() {
  return (
    <div className="flex items-center gap-4 rounded-md bg-sheet px-4 py-2.5 shadow-raised ring-1 ring-rule">
      <SortCubes total={6} filled={1} />
      <span className="shrink-0 text-sm text-ink-soft">
        <b className="nums font-display text-[17px] text-ink">1</b> of 6 sorted
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-ink-faint">
        Next for you: <b className="font-medium text-ink">Mark the days you can do</b>
      </span>
      <FakeButton>Mark my days</FakeButton>
      <ChevronIcon direction="down" size={13} className="text-ink-soft" />
    </div>
  );
}

export function WhereScreen() {
  return (
    <>
      <SortStrip />
      <div className="mt-3 overflow-hidden rounded-md border border-rule bg-sheet">
        <div className="flex items-center gap-3 px-4 py-3">
          <ChevronIcon direction="down" size={15} className="shrink-0 text-ink-faint" />
          <h4 className="font-display text-lg">Ideas</h4>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink-faint">{IDEAS.length} ideas</span>
        </div>
        <div className="flex flex-col gap-3 border-t border-rule px-4 pb-4 pt-3">
          <div className="flex items-center gap-2">
            <span className="h-[34px] flex-1 rounded-sm border border-rule-strong bg-sheet" />
            <FakeButton>Add</FakeButton>
          </div>
          <span className="flex w-fit rounded-sm border border-rule p-0.5 text-xs">
            <span className="rounded-sm bg-ink px-3 py-1 text-paper">Most votes</span>
            <span className="px-3 py-1 text-ink-soft">Newest</span>
          </span>
          <ul className="divide-y divide-rule rounded-md border border-rule bg-sheet">
            {IDEAS.map((idea) => (
              <li key={idea.title} className="flex items-center gap-3 px-3 py-2.5">
                <span
                  className={cx(
                    "grid size-11 shrink-0 place-content-center justify-items-center gap-0.5 rounded-sm border",
                    idea.mine ? "border-green-edge bg-green-soft text-green" : "border-rule-strong bg-sheet text-ink-soft",
                  )}
                >
                  <ArrowUpIcon size={12} />
                  <span className="nums text-xs leading-none">{idea.votes}</span>
                </span>
                <span className="grid min-w-0 flex-1 gap-0.5 leading-snug">
                  <span className="text-[15px]">{idea.title}</span>
                  <span className="flex items-center gap-1.5 text-xs text-ink-faint">
                    <Avatar name={idea.by.name} tone={idea.by.tone} size={16} />
                    {idea.by.name}
                  </span>
                </span>
                <CrossIcon size={12} className="mr-2 text-ink-faint" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

// People free on each September day; 12–19 is the week all six can make.
const FREE = [2, 3, 1, 2, 4, 3, 2, 3, 4, 5, 4, 6, 6, 6, 6, 6, 6, 6, 6, 3, 2, 4, 3, 1, 2, 3, 2, 1, 2, 3];
const MINE = new Set([5, 6, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 22, 26]);
const ANSWERED = [
  { who: you, days: MINE.size },
  { who: priya, days: 11 },
  { who: sam, days: 9 },
  { who: jo, days: 13 },
  { who: alex, days: 8 },
  { who: maya, days: 12 },
];
const FIRST_WEEKDAY = 2;
const FILL: Record<string, string> = {
  all: "bg-pastel-green",
  "some-1": "bg-some-free-1",
  "some-2": "bg-some-free-2",
  "some-3": "bg-some-free-3",
};
const INK: Record<string, string> = {
  all: "text-pastel-green-ink",
  "some-1": "text-some-free-ink",
  "some-2": "text-some-free-ink",
  "some-3": "text-some-free-ink",
};

function monthWeeks() {
  const slots = [...Array<number | null>(FIRST_WEEKDAY).fill(null), ...FREE.map((_, i) => i + 1)];
  while (slots.length % 7) slots.push(null);
  return Array.from({ length: slots.length / 7 }, (_, w) => {
    const days = slots.slice(w * 7, w * 7 + 7);
    const keys = days.map((d) => (d === null ? null : markKey(dayMark({ tally: FREE[d - 1] ?? 0, memberCount: 6, inTrip: false, picking: false, inPick: false, pending: false }))));
    const joins = weekJoins(keys);
    return days.map((day, i) => ({ day, key: keys[i] ?? "", join: joins[i] ?? { left: false, right: false } }));
  });
}

const iso = (day: number) => `2027-09-${String(day).padStart(2, "0")}`;
const BEST = { start: iso(12), end: iso(19) };
const RAIL: { key: string; label: string; glyph: ReactNode; summary: TabSummary; on?: boolean }[] = [
  { key: "mine", label: "Your days", glyph: <CheckIcon />, summary: yourDaysTab([...MINE].map(iso), 0) },
  { key: "group", label: "The group", glyph: <NavGlyph name="friends" />, summary: groupTab(6, []), on: true },
  { key: "trip", label: "The trip", glyph: <NavGlyph name="dates" />, summary: tripTab(null, null, BEST) },
];

function DatesRail() {
  return (
    <div className="flex flex-col overflow-hidden rounded-l-md border-r border-rule bg-sheet-2">
      {RAIL.map((r) => (
        <div key={r.key} className={cx("border-b border-rule px-3 py-3", r.on && "border-l-2 border-l-pen bg-sheet")}>
          <span className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.06em] text-ink-faint">
            {r.glyph}
            {r.label}
          </span>
          <p className="mt-1.5 font-display text-[15px] font-semibold leading-tight">{r.summary.value}</p>
          <p className="mt-0.5 text-[11px] leading-snug text-ink-faint">{r.summary.note}</p>
        </div>
      ))}
    </div>
  );
}

export function WhenScreen() {
  return (
    <>
      <PageHead title="Dates" />
      <div className="grid grid-cols-[132px_minmax(0,1fr)_168px] rounded-md border border-rule bg-sheet">
        <DatesRail />
        <div className="min-w-0 px-3 py-3">
          <div className="flex items-center gap-2">
            <ChevronIcon direction="left" size={12} className="text-ink-soft" />
            <b className="font-display text-sm font-semibold">September 2027</b>
            <ChevronIcon direction="right" size={12} className="text-ink-soft" />
          </div>
          <div className="mt-2 grid grid-cols-7 text-center font-mono text-[9px] text-ink-faint">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          {monthWeeks().map((week, w) => (
            <div key={w} className="grid grid-cols-7">
              {week.map((c, i) => (
                <span key={i} className={cx("relative grid h-9 place-items-center text-xs", INK[c.key] ?? "text-ink")}>
                  {c.day !== null && c.key ? (
                    <span aria-hidden className={cx("absolute inset-y-[3px] rounded-sm", c.join.left ? "left-0 rounded-l-none" : "left-[3px]", c.join.right ? "right-0 rounded-r-none" : "right-[3px]", FILL[c.key])} />
                  ) : null}
                  {c.day !== null && MINE.has(c.day) ? <span aria-hidden className="absolute size-6 rounded-full bg-current/15" /> : null}
                  {c.day !== null ? <span className="nums relative">{c.day}</span> : null}
                </span>
              ))}
            </div>
          ))}
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5 text-[10.5px] text-ink-soft">
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="size-3 rounded-full bg-ink-soft/20" />
              You can do
            </span>
            <LegendKey swatch="bg-pastel-green border-pastel-green" label="Everyone free" />
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="size-3 rounded-sm bg-some-free-2" />
              Some free
            </span>
          </div>
        </div>
        <div className="flex flex-col border-l border-rule bg-sheet-2 px-3 py-3">
          <span className="font-mono text-[9.5px] uppercase tracking-[0.06em] text-ink-faint">Best fit</span>
          <p className="nums mt-1.5 text-[13px] font-medium">{spanLabel(BEST.start, BEST.end)}</p>
          <p className="nums mt-0.5 text-[10.5px] text-ink-faint">8 days · 6 of 6 free</p>
          <span className="mt-2.5"><FakeButton small>Use these</FakeButton></span>
          <span className="mt-4 flex justify-between font-mono text-[9.5px] uppercase tracking-[0.06em] text-ink-faint">
            Who has answered <span>6 of 6</span>
          </span>
          <ul className="mt-2 flex flex-col gap-1.5">
            {ANSWERED.map(({ who, days }) => (
              <li key={who.name} className="flex items-center gap-2 text-xs">
                <Avatar name={who.name} tone={who.tone} size={18} />
                <span className="flex-1">{who.name}</span>
                <span className="nums text-[10.5px] text-ink-faint">{days} days</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
