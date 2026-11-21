"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";

import { BestDatesCard, type BestDate } from "@/components/availability/best-dates-card";
import { DatesTabs, type DatesTab } from "@/components/availability/dates-tabs";
import { CommitBar, Coverage, DatesKey, MarkSwitch, MonthPager, PagerHint, SaveBar, hintFor, tabStubs } from "@/components/availability/dates-board-parts";
import { dayLook } from "@/components/availability/day-look";
import { ForecastPanel } from "@/components/availability/forecast-panel";
import { LengthTiles } from "@/components/availability/length-tiles";
import { useCalendarSlots } from "@/components/availability/calendar-fill";
import { MonthGrid, type DayView } from "@/components/availability/month-grid";
import type { CalendarSource } from "@/components/availability/use-calendar-fill";
import { useAvailabilityPaint } from "@/components/availability/use-availability-paint";
import { useWindowPick } from "@/components/availability/use-window-pick";
import { addMonths, daysInMonth, type IsoMonth } from "@floc/core/dates/availability";
import { dateRange, today, type IsoDate } from "@floc/core/dates/dates";
import type { LengthChoice, TripLength } from "@floc/core/dates/finding/trip-length";
import type { DayLoad } from "@floc/core/trip/trip-window";
import type { GroupAnswer } from "@floc/core/dates/dates-tabs";
import type { DailyForecast, TripForecast } from "@/server/itinerary/weather";

type DatesFinder = {
  windows: BestDate[];
  lengths: LengthChoice[];
  setLength: (length: TripLength, picked: boolean) => Promise<void>;
  apply: (start: string, end: string) => Promise<void>;
};

export type DatesBoardProps = {
  tripId: number;
  firstMonth: IsoMonth;
  mine: string[];
  liked: string[];
  tallies: Record<string, number>;
  othersPrefer: Record<string, number>;
  memberCount: number;
  tripStart: string | null;
  tripEnd: string | null;
  dayLoads: DayLoad[];
  weather: TripForecast | null;
  weatherLocked: boolean;
  group: GroupAnswer[];
  viewerId: string;
  finder: DatesFinder;
  slots: { faces: ReactNode; who: ReactNode; trip: ReactNode; locked: ReactNode };
  save: (add: string[], remove: string[], prefer: { on: string[]; off: string[] }) => Promise<void>;
  saveDates: (start: string | null, end: string | null) => Promise<{ error?: string }>;
  calendar: CalendarSource | null;
};

function tripWeather(weather: TripForecast | null, start: string | null, end: string | null) {
  const tripDays = start && end ? dateRange(start, end) : [];
  const byDate: Record<IsoDate, DailyForecast> = {};
  for (const d of weather?.days ?? []) if (tripDays.includes(d.date)) byDate[d.date] = d;
  return { tripDays, byDate };
}

const dateUnder = (e: React.PointerEvent) =>
  document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-date]")?.dataset.date ?? null;

function useBestDates(windows: BestDate[], tripStart: string | null, tripEnd: string | null) {
  const [at, setAt] = useState(0);
  const shown = Math.min(at, Math.max(0, windows.length - 1));
  const window = windows[shown] ?? null;
  return {
    at: shown,
    window,
    first: windows[0] ?? null,
    current: !!window && window.start === tripStart && window.end === tripEnd,
    step: (delta: number) => setAt((shown + delta + windows.length) % windows.length),
  };
}

export function DatesBoard(props: DatesBoardProps) {
  const { tripStart, tripEnd, weather, slots, finder } = props;
  const [tab, setTab] = useState<DatesTab>("mine");
  const [month, setMonth] = useState(props.firstMonth);
  const [hourDay, setHourDay] = useState<IsoDate | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const surface = useRef<HTMLDivElement>(null);
  const paint = useAvailabilityPaint(props.mine, props.liked);
  const pick = useWindowPick(tripStart, tripEnd, props.dayLoads);
  const best = useBestDates(finder.windows, tripStart, tripEnd);
  const cal = useCalendarSlots({ tripId: props.tripId, month, calendar: props.calendar, show: tab === "mine", empty: props.mine.length === 0 && paint.changed === 0 });
  const { choice, choose } = cal;

  const { tripDays, byDate } = tripWeather(weather, tripStart, tripEnd);

  const ctx = {
    tab, tallies: paint.withEdits(props.tallies), memberCount: props.memberCount, tripStart, tripEnd, now: today(),
    isFree: paint.isFree, isLiked: (d: string) => paint.markOf(d) === "prefer",
    prefers: (d: string) => (props.othersPrefer[d] ?? 0) + (paint.markOf(d) === "prefer" ? 1 : 0),
    answered: props.group.filter((g) => g.answered && g.id !== props.viewerId).length + (props.mine.length + paint.add.length - paint.remove.length > 0 ? 1 : 0),
    picking: pick.editing, inPick: pick.inPick, pending: pick.pending,
    hiOf: (d: string) => byDate[d], hourDay,
  };
  const view = (date: string): DayView => ({ ...dayLook(ctx, date), ...handlers(date) });

  const capture = (e: React.PointerEvent) => {
    e.preventDefault();
    try {
      surface.current?.setPointerCapture(e.pointerId);
    } catch {
    }
  };
  function handlers(date: string): Pick<DayView, "press" | "activate"> {
    if (tab === "mine") return { press: (e) => { capture(e); paint.start(date); }, activate: () => paint.toggle(date) };
    if (tab === "trip") return { press: (e) => { capture(e); pick.press(date); }, activate: () => { pick.press(date); pick.release(); } };
    if (tab === "forecast" && byDate[date]) return { press: null, activate: () => setHourDay(date) };
    return { press: null, activate: null };
  }

  const onMove = (e: React.PointerEvent) => {
    const date = dateUnder(e);
    if (paint.dragging) return date && paint.extend(date);
    if (pick.dragging) return date && pick.extend(date);
    if (tab === "trip") pick.hoverOn(date);
  };
  const release = () => { paint.release(); pick.release(); };
  const onSave = () => startTransition(async () => { await props.save(paint.diff.add, paint.diff.remove, paint.diff.prefer); paint.saved(); });
  const onFill = () => paint.fill(daysInMonth(month).filter((d) => d >= ctx.now));
  const onCommit = () => {
    if (pick.costLabel && !pick.armed) return pick.arm();
    startTransition(async () => {
      const result = await props.saveDates(pick.start, pick.end);
      setProblem(result.error ?? null);
      pick.disarm();
    });
  };

  const showForecast = weather !== null || props.weatherLocked;
  const stubs = tabStubs({
    ...props, unsaved: paint.changed, faces: slots.faces, bestWindow: best.first,
    forecast: showForecast ? { weather, tripDays: tripDays.length, forecastDays: Object.keys(byDate).length } : null,
  });
  const quiet = { mine: paint.changed > 0, group: true, trip: pick.editing, forecast: !weather }[tab];
  const bestCard = (
    <BestDatesCard windows={finder.windows} at={best.at} onStep={best.step} apply={finder.apply}
      state={best.current ? "set" : tripStart ? "change" : "new"} />
  );
  const mine = (
    <>
      <LengthTiles choices={finder.lengths} viewerId={props.viewerId} save={finder.setLength} />
      <Coverage isFree={paint.isFree} start={tripStart} end={tripEnd} />
    </>
  );
  const panel: Record<DatesTab, ReactNode> = {
    mine: choice ? <div className="hidden lg:block">{choice}</div> : mine,
    group: slots.who,
    trip: <>{slots.trip}{bestCard}</>,
    forecast: weather ? (
      <ForecastPanel days={tripDays} byDate={byDate} hourly={weather.hourly} placeName={weather.placeName}
        horizonEnd={weather.horizonEnd} selected={hourDay} onSelect={setHourDay} />
    ) : slots.locked,
  };

  return (
    <section className="overflow-hidden rounded-md border border-rule bg-sheet shadow-card lg:grid lg:grid-cols-[15rem_minmax(0,1fr)_18rem]">
      <DatesTabs stubs={stubs} open={tab} onOpen={(t) => { setTab(t); setHourDay(null); }} />
      <div ref={surface} className="min-w-0 px-2.5 pb-1 pt-3 sm:px-5 lg:pt-4"
        onPointerMove={onMove} onPointerLeave={() => pick.hoverOn(null)} onPointerUp={release} onPointerCancel={release}>
        {choice ? <div className="-mx-2.5 mb-3 border-b border-rule sm:-mx-5 lg:hidden">{choice}</div> : null}
        <MonthPager month={month} page={(n) => setMonth(addMonths(month, n))} menu={cal.menu}
          lead={tab === "mine" ? <MarkSwitch mode={paint.mode} onMode={paint.setMode} /> : <PagerHint hint={quiet ? "" : hintFor(tab)} />} />
        <MonthGrid month={month} view={view} />
        <DatesKey />
        {{
          mine: (
            <>
              {!choose ? cal.note : null}
              <SaveBar changed={paint.changed} pending={pending} onSave={onSave} onFill={onFill} more={cal.menu} />
            </>
          ),
          trip: pick.editing && (
            <CommitBar pick={pick} dated={!!tripStart} problem={problem} pending={pending} onCommit={onCommit} onDiscard={pick.discard} />
          ),
          group: null,
          forecast: null,
        }[tab]}
      </div>
      <aside className="min-w-0 border-t border-rule bg-sheet-2 lg:border-l lg:border-t-0 [&>*+*]:border-t [&>*+*]:border-rule">{panel[tab]}</aside>
    </section>
  );
}
