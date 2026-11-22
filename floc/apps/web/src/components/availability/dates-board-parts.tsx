"use client";

import type { ReactNode } from "react";

import type { DatesTab, TabStub } from "@/components/availability/dates-tabs";
import { NavGlyph } from "@/components/system/icons/nav";
import { CheckIcon, ChevronIcon } from "@/components/system/icons";
import { ProStar } from "@/components/system/pro-star";
import { Button, LegendKey, busyMark, cx, panelTitleClass, trackSegmentClass } from "@/components/system/ui";
import { SegmentTrack } from "@/components/system/segment-track";
import type { PaintMode } from "@floc/core/dates/finding/day-paint";
import { EVERYONE_FREE_WORDS, MARK_WORDS, SOME_FREE_WORDS } from "@floc/core/dates/words";
import { WeatherGlyph } from "@/components/system/icons/weather";
import { formatMonth, formatShortMonth, tripCoverage, type IsoMonth } from "@floc/core/dates/availability";
import { formatDate, type IsoDate } from "@floc/core/dates/dates";
import { forecastTab, groupTab, tripTab, yourDaysTab, type GroupAnswer } from "@floc/core/dates/dates-tabs";
import type { TripForecast } from "@/server/itinerary/weather";
import { countWord } from "@floc/core/text/count-word";

export function AsideHead({ title, id, meta }: { title: string; id?: string; meta?: ReactNode }) {
  return (
    <div className="flex min-h-[26px] items-center justify-between gap-2">
      <h3 id={id} className={cx(panelTitleClass, "min-w-0")}>{title}</h3>
      {meta ? <span className="shrink-0">{meta}</span> : null}
    </div>
  );
}

export function MonthPager({ month, page, lead, menu }: { month: IsoMonth; page: (delta: number) => void; lead: ReactNode; menu?: ReactNode }) {
  const round = "!size-8 !p-0";
  return (
    <div className="mb-3.5 flex min-h-8 flex-wrap items-center gap-x-1.5 gap-y-2 sm:gap-x-2.5">
      <span className="flex shrink-0 items-center">{lead}</span>
      <span className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2.5">
        {menu ? <span className="hidden sm:contents">{menu}</span> : null}
        <Button variant="secondary" className={round} aria-label="Earlier month" onClick={() => page(-1)}>
          <ChevronIcon direction="left" />
        </Button>
        <p className="min-w-[4.25rem] whitespace-nowrap text-center font-display text-[13px] font-semibold sm:min-w-0 sm:text-[15px] xl:min-w-[9.5rem]">
          <span className="sm:hidden">{formatShortMonth(month)}</span>
          <span className="hidden sm:inline">{formatMonth(month)}</span>
        </p>
        <Button variant="secondary" className={round} aria-label="Later month" onClick={() => page(1)}>
          <ChevronIcon direction="right" />
        </Button>
      </span>
    </div>
  );
}

export const PagerHint = ({ hint }: { hint: string }) => (hint ? <span className="hidden text-[13px] text-ink-faint sm:block">{hint}</span> : null);

const MARK_MODES: { value: PaintMode; label: string; swatch: string }[] = [
  { value: "free", label: MARK_WORDS.free, swatch: "border border-ink-faint" },
  { value: "prefer", label: MARK_WORDS.prefer, swatch: "border-[1.5px] border-ink bg-sheet" },
];

const ownSwatch = (look: string) => <span aria-hidden className={cx("size-3 shrink-0 rounded-full", look)} />;

export function MarkSwitch({ mode, onMode }: { mode: PaintMode; onMode: (mode: PaintMode) => void }) {
  return (
    <SegmentTrack role="group" aria-label="What a press marks" className="flex items-center gap-1">
      {MARK_MODES.map((m) => (
        <button
          key={m.value}
          type="button"
          aria-pressed={m.value === mode}
          onClick={() => onMode(m.value)}
          className={cx(trackSegmentClass(m.value === mode), "flex items-center gap-1.5 whitespace-nowrap px-2.5 py-[3px] text-[13px] leading-[17px] sm:px-3")}
        >
          {ownSwatch(m.swatch)}
          {m.label}
        </button>
      ))}
    </SegmentTrack>
  );
}

function Bar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2.5 border-t border-rule pb-3.5 pt-3">{children}</div>;
}

export function SaveBar({ changed, pending, onSave, onFill, more }: { changed: number; pending: boolean; onSave: () => void; onFill?: () => void; more?: ReactNode }) {
  return (
    <Bar>
      {onFill ? (
        <Button variant="secondary" onClick={onFill}>
          Free all month
        </Button>
      ) : null}
      {more ? <span className="ml-auto flex items-center sm:hidden">{more}</span> : null}
      {changed > 0 ? (
        <span className="ml-auto flex flex-wrap items-center justify-end gap-2.5">
          <span className="text-[13px] text-ink-soft">{countWord(changed, "change")} not saved</span>
          <Button variant="primary" disabled={pending} aria-busy={pending || undefined} onClick={onSave}>
            {`Save ${countWord(changed, "day")}`}
            {busyMark(pending)}
          </Button>
        </span>
      ) : null}
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
        <Button variant={pick.armed ? "danger" : "primary"} disabled={!pick.start || !pick.changed || pick.halfMade || pending} aria-busy={pending || undefined} onClick={onCommit}>
          {verb}
          {busyMark(pending)}
        </Button>
      </span>
    </Bar>
  );
}

export function DatesKey() {
  const swatch = (cls: string) => <span aria-hidden className={cx("size-3 shrink-0 rounded-[4px] max-sm:size-2", cls)} />;
  const item = "flex items-center gap-1.5";
  return (
    <div className="flex flex-wrap gap-x-[18px] gap-y-2 py-3 text-xs text-ink-soft max-sm:gap-x-3 max-sm:gap-y-1.5 max-sm:whitespace-nowrap max-sm:text-[11px] max-sm:[&>span]:gap-1 max-sm:[&>span]:text-[11px]">
      {MARK_MODES.map((m) => (
        <span key={m.value} className={item}>
          {ownSwatch(m.swatch)}
          {m.label}
        </span>
      ))}
      <span className={item}>
        <span className="flex gap-[3px]">
          {swatch("bg-some-free-1")}
          {swatch("bg-some-free-2")}
          {swatch("bg-some-free-3")}
        </span>
        {SOME_FREE_WORDS}
      </span>
      <LegendKey swatch="bg-pastel-green border-pastel-green" label={EVERYONE_FREE_WORDS} />
      <LegendKey swatch="bg-green border-green" label="The trip" />
    </div>
  );
}

export function Coverage({ isFree, start, end }: { isFree: (d: string) => boolean; start: string | null; end: string | null }) {
  const c = tripCoverage(isFree, start, end);
  if (!c) return null;
  return (
    <div className="p-4">
      <AsideHead title="In the trip" />
      <p className="nums mt-1 font-mono text-base text-ink">
        {c.free} of {countWord(c.total, "day")}
      </p>
      <p className="mt-0.5 text-[13px] text-ink-soft">
        {c.missing.length ? `You can't do ${c.missing.map((d) => formatDate(d, { weekday: false })).join(", ")}` : "You can do every day of it"}
      </p>
    </div>
  );
}

export const hintFor = (tab: DatesTab): string => HINT[tab];

const HINT: Record<DatesTab, string> = {
  mine: "",
  group: "",
  trip: "Press the first day, then the last",
  forecast: "Press a trip day for its hours",
};

export function tabStubs(p: {
  mine: string[];
  unsaved: number;
  group: GroupAnswer[];
  viewerId: string;
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
      summary: yourDaysTab(p.mine, p.unsaved, p.group.some((g) => g.id === p.viewerId && g.answered)),
      corner: p.unsaved ? <span className="whitespace-nowrap rounded-full bg-highlight px-2 text-[11px] font-medium text-highlight-ink">Not saved</span> : null,
    },
    { key: "group", label: "The group", glyph: <NavGlyph name="friends" />, summary: groupTab(p.group, p.viewerId), corner: p.faces },
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
