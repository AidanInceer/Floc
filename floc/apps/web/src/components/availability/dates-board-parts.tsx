"use client";

import type { ReactNode } from "react";

import type { DatesTab, TabStub } from "@/components/availability/dates-tabs";
import { NavGlyph } from "@/components/chrome/nav-glyphs";
import { CheckIcon, ChevronIcon } from "@/components/system/icons";
import { ProStar } from "@/components/system/pro-star";
import { Button, LegendKey, cx } from "@/components/system/ui";
import { WeatherGlyph } from "@/components/system/weather-glyph";
import { formatMonth, tripCoverage, type IsoMonth } from "@floc/core/dates/availability";
import { formatDate, type IsoDate } from "@floc/core/dates/dates";
import { forecastTab, groupTab, tripTab, yourDaysTab } from "@floc/core/dates/dates-tabs";
import type { TripForecast } from "@/server/itinerary/weather";

const typed = "font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint";
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function MonthPager({ month, page, hint }: { month: IsoMonth; page: (delta: number) => void; hint: string }) {
  const round = "!size-8 !rounded-full !p-0";
  return (
    <div className="mb-3.5 flex items-center gap-2.5">
      <Button variant="secondary" className={round} aria-label="Earlier month" onClick={() => page(-1)}>
        <ChevronIcon direction="left" />
      </Button>
      <p className="min-w-[9.5rem] text-center font-display text-[15px] font-semibold">{formatMonth(month)}</p>
      <Button variant="secondary" className={round} aria-label="Later month" onClick={() => page(1)}>
        <ChevronIcon direction="right" />
      </Button>
      {hint ? <span className="ml-auto hidden text-[13px] text-ink-faint sm:block">{hint}</span> : null}
    </div>
  );
}

function Bar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2.5 border-t border-rule pb-3.5 pt-3">{children}</div>;
}

export function SaveBar({ changed, pending, onSave }: { changed: number; pending: boolean; onSave: () => void }) {
  return (
    <Bar>
      <span className="text-[13px] text-ink-soft">{plural(changed, "change")} not saved</span>
      <Button variant="primary" className="ml-auto" disabled={pending} onClick={onSave}>
        {pending ? "Saving…" : `Save ${plural(changed, "day")}`}
      </Button>
    </Bar>
  );
}

export type CommitState = {
  start: string | null;
  end: string | null;
  halfMade: boolean;
  changed: boolean;
  armed: boolean;
  costLabel: string | null;
};

// The shrink cost is said on the button doing it, not in a dialog: the days being cut are drawn above (ticket 140).
export function CommitBar({ pick, dated, problem, pending, onCommit, onDiscard }: {
  pick: CommitState;
  dated: boolean;
  problem: string | null;
  pending: boolean;
  onCommit: () => void;
  onDiscard: () => void;
}) {
  const verb = pick.armed ? pick.costLabel : dated ? "Change dates" : "Set the dates";
  return (
    <Bar>
      {pick.start ? (
        <span className="nums text-[13px] text-ink">
          {pick.halfMade ? `${formatDate(pick.start)} to…` : `${formatDate(pick.start)} – ${formatDate(pick.end)}`}
        </span>
      ) : null}
      {problem ? <span className="text-[13px] text-red">{problem}</span> : null}
      <span className="ml-auto flex gap-2">
        <Button variant="ghost" disabled={!pick.changed} onClick={onDiscard}>
          Discard
        </Button>
        <Button variant={pick.armed ? "danger" : "primary"} disabled={!pick.start || !pick.changed || pick.halfMade || pending} onClick={onCommit}>
          {pending ? "Setting…" : verb}
        </Button>
      </span>
    </Bar>
  );
}

// In the order a group books: who can, then the trip.
export function DatesKey() {
  const swatch = (cls: string) => <span aria-hidden className={cx("size-3 rounded-[4px]", cls)} />;
  const item = "flex items-center gap-1.5";
  return (
    <div className="flex flex-wrap gap-x-[18px] gap-y-2 py-3 text-xs text-ink-soft">
      <span className={item}>
        <span aria-hidden className="size-3.5 rounded-full bg-ink-soft/20" />
        You can do
      </span>
      <LegendKey swatch="bg-pastel-green border-pastel-green" label="Everyone free" />
      <span className={item}>
        <span className="flex gap-[3px]">
          {swatch("bg-some-free-1")}
          {swatch("bg-some-free-2")}
          {swatch("bg-some-free-3")}
        </span>
        Some free
      </span>
      <LegendKey swatch="bg-green border-green" label="The trip" />
    </div>
  );
}

export function Coverage({ isFree, start, end }: { isFree: (d: string) => boolean; start: string | null; end: string | null }) {
  const c = tripCoverage(isFree, start, end);
  if (!c) return null;
  return (
    <div className="p-4">
      <p className={typed}>In the trip</p>
      <p className="nums mt-1 font-mono text-base text-ink">
        {c.free} of {plural(c.total, "day")}
      </p>
      <p className="mt-0.5 text-[13px] text-ink-soft">
        {c.missing.length ? `You can't do ${c.missing.map((d) => formatDate(d, { weekday: false })).join(", ")}` : "You can do every day of it"}
      </p>
    </div>
  );
}

export const HINT: Record<DatesTab, string> = {
  mine: "Drag across the days you can do",
  group: "",
  trip: "Press the first day, then the last",
  forecast: "Press a trip day for its hours",
};

export function tabStubs(p: {
  mine: string[];
  unsaved: number;
  memberCount: number;
  waitingOn: string[];
  faces: ReactNode;
  tripStart: string | null;
  tripEnd: string | null;
  bestWindow: { start: IsoDate; end: IsoDate } | null;
  forecast: { weather: TripForecast | null; tripDays: number; forecastDays: number } | null;
}): TabStub[] {
  const stubs: TabStub[] = [
    {
      key: "mine",
      label: "Your days",
      glyph: <CheckIcon />,
      summary: yourDaysTab(p.mine, p.unsaved),
      corner: p.unsaved ? <span className="whitespace-nowrap rounded-full bg-highlight px-2 text-[11px] font-medium text-highlight-ink">Not saved</span> : null,
    },
    { key: "group", label: "The group", glyph: <NavGlyph name="friends" />, summary: groupTab(p.memberCount, p.waitingOn), corner: p.faces },
    { key: "trip", label: "The trip", glyph: <NavGlyph name="dates" />, summary: tripTab(p.tripStart, p.tripEnd, p.bestWindow) },
  ];
  const f = p.forecast;
  if (f)
    stubs.push({
      key: "forecast",
      label: (
        <>
          Forecast <ProStar />
          <span className="sr-only">, a Floc Pro feature</span>
        </>
      ),
      glyph: <WeatherGlyph condition="part" size={13} />,
      summary: f.weather
        ? forecastTab(f.tripDays, f.forecastDays, f.weather.horizonEnd)
        : { value: "Floc Pro", short: "Pro", note: "The weather on the trip's days", open: false },
    });
  return stubs;
}
