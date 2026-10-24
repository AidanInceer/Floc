"use client";

/**
 * The Dates card: four stubs down the left, one month, and the open stub's panel on the
 * right. A day has one colour on every tab (`dayLook`); a tab only changes what a press
 * does and what the panel says.
 */
import { useRef, useState, useTransition, type ReactNode } from "react";

import { DatesTabs, type DatesTab } from "@/components/availability/dates-tabs";
import { CommitBar, Coverage, DatesKey, HINT, MonthPager, SaveBar, tabStubs } from "@/components/availability/dates-board-parts";
import { dayLook } from "@/components/availability/day-look";
import { ForecastPanel } from "@/components/availability/forecast-panel";
import { MonthGrid, type DayView } from "@/components/availability/month-grid";
import { useAvailabilityPaint } from "@/components/availability/use-availability-paint";
import { useWindowPick } from "@/components/availability/use-window-pick";
import { addMonths, type IsoMonth } from "@floc/core/dates/availability";
import { dateRange, today, type IsoDate } from "@floc/core/dates/dates";
import type { DayLoad } from "@floc/core/trip/trip-window";
import type { DailyForecast, TripForecast } from "@/server/itinerary/weather";

export type DatesBoardProps = {
  firstMonth: IsoMonth;
  mine: string[];
  tallies: Record<string, number>;
  memberCount: number;
  tripStart: string | null;
  tripEnd: string | null;
  dayLoads: DayLoad[];
  weather: TripForecast | null;
  weatherLocked: boolean;
  waitingOn: string[];
  bestWindow: { start: IsoDate; end: IsoDate } | null;
  /** Server-drawn pieces: the group's faces, and the panels' blocks. */
  slots: { faces: ReactNode; best: ReactNode; who: ReactNode; trip: ReactNode; locked: ReactNode };
  save: (add: string[], remove: string[]) => Promise<void>;
  saveDates: (start: string | null, end: string | null) => Promise<{ error?: string }>;
};

// Only the trip's own days carry weather (ticket 148).
function tripWeather(weather: TripForecast | null, start: string | null, end: string | null) {
  const tripDays = start && end ? dateRange(start, end) : [];
  const byDate: Record<IsoDate, DailyForecast> = {};
  for (const d of weather?.days ?? []) if (tripDays.includes(d.date)) byDate[d.date] = d;
  return { tripDays, byDate };
}

const dateUnder = (e: React.PointerEvent) =>
  document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-date]")?.dataset.date ?? null;

export function DatesBoard(props: DatesBoardProps) {
  const { tripStart, tripEnd, weather, slots } = props;
  const [tab, setTab] = useState<DatesTab>("mine");
  const [month, setMonth] = useState(props.firstMonth);
  const [hourDay, setHourDay] = useState<IsoDate | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const surface = useRef<HTMLDivElement>(null);
  const paint = useAvailabilityPaint(props.mine);
  const pick = useWindowPick(tripStart, tripEnd, props.dayLoads);

  const { tripDays, byDate } = tripWeather(weather, tripStart, tripEnd);

  const ctx = {
    tab, tallies: paint.withEdits(props.tallies), memberCount: props.memberCount, tripStart, tripEnd, now: today(),
    isFree: paint.isFree, picking: pick.editing, inPick: pick.inPick, pending: pick.pending,
    hiOf: (d: string) => byDate[d], hourDay,
  };
  const view = (date: string): DayView => ({ ...dayLook(ctx, date), ...handlers(date) });

  // Capture on the surface, not the cell (ticket 127): a touch pointer is held by the cell it pressed.
  const capture = (e: React.PointerEvent) => {
    e.preventDefault();
    try {
      surface.current?.setPointerCapture(e.pointerId);
    } catch {
      // The pointer is already gone; the press still stands.
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
  const onSave = () => startTransition(async () => { await props.save(paint.add, paint.remove); paint.saved(); });
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
    ...props, unsaved: paint.changed, faces: slots.faces,
    forecast: showForecast ? { weather, tripDays: tripDays.length, forecastDays: Object.keys(byDate).length } : null,
  });
  // The hint goes once there is something to act on, and never offers hours that aren't there.
  const quiet = { mine: paint.changed > 0, group: true, trip: pick.editing, forecast: !weather }[tab];
  const panel: Record<DatesTab, ReactNode> = {
    mine: <><Coverage isFree={paint.isFree} start={tripStart} end={tripEnd} />{slots.best}</>,
    group: <>{slots.best}{slots.who}</>,
    trip: <>{slots.trip}{slots.best}</>,
    forecast: weather ? (
      <ForecastPanel days={tripDays} byDate={byDate} hourly={weather.hourly} placeName={weather.placeName}
        horizonEnd={weather.horizonEnd} selected={hourDay} onSelect={setHourDay} />
    ) : slots.locked,
  };

  return (
    <section className="overflow-hidden rounded-[18px] border border-rule bg-sheet shadow-card lg:grid lg:grid-cols-[15rem_minmax(0,1fr)_18rem]">
      <DatesTabs stubs={stubs} open={tab} onOpen={(t) => { setTab(t); setHourDay(null); }} />
      <div ref={surface} className="min-w-0 px-2.5 pb-1 pt-3 sm:px-5 lg:pt-4"
        onPointerMove={onMove} onPointerLeave={() => pick.hoverOn(null)} onPointerUp={release} onPointerCancel={release}>
        <MonthPager month={month} page={(n) => setMonth(addMonths(month, n))} hint={quiet ? "" : HINT[tab]} />
        <MonthGrid month={month} view={view} />
        <DatesKey />
        {{
          mine: paint.changed > 0 && <SaveBar changed={paint.changed} pending={pending} onSave={onSave} />,
          trip: pick.editing && (
            <CommitBar pick={pick} dated={!!tripStart} problem={problem} pending={pending} onCommit={onCommit} onDiscard={pick.discard} />
          ),
          group: null,
          forecast: null,
        }[tab]}
      </div>
      <aside className="min-w-0 border-t border-rule lg:border-l lg:border-t-0 [&>*+*]:border-t [&>*+*]:border-rule">{panel[tab]}</aside>
    </section>
  );
}
