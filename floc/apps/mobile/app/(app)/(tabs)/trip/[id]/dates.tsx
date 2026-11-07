/**
 * Dates (ticket 297) — the screen that settles when a trip happens, drawn as the web's narrow Dates card.
 *
 * ONE MONTH, FOUR VIEWS. A row of four stubs says where each view stands; the month under them never
 * changes colour between views (`dayLookOf`), only what a press does and the panel below it.
 *   Your days  — paint the days you could go.
 *   The group  — read-only, and who still owes an answer.
 *   The trip   — press the first day, then the last, to set the trip's dates.
 *   Forecast   — the high on the trip's own days. Pro, and says so when locked.
 *
 * UNDATED IS THE NORMAL STARTING STATE (rule 9). Nothing here treats a trip with no dates as broken,
 * and clearing the dates is an ordinary thing to do.
 *
 * NOTHING WRITES UNTIL SAVE. A drag builds up local edits and one action sends them.
 *
 * NO TIMEZONES ANYWHERE (rule 10). Every date on this screen is a `YYYY-MM-DD` string.
 *
 * YOU ANSWER ONLY FOR YOURSELF. There is no control to mark somebody else's days (rule 6).
 */
import { bestWindow, monthOf, thisMonth } from "@floc/core/dates/availability";
import { paintRange } from "@floc/core/dates/calendar-gestures";
import { dateRange, formatDateRange, nightsBetween, today } from "@floc/core/dates/dates";
import { datesMoment } from "@floc/core/dates/dates-moment";
import { forecastTab, groupTab, spanLabel, tripTab, yourDaysTab } from "@floc/core/dates/dates-tabs";
import { bookingPlan } from "@floc/core/trip/booking/booking-links";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";

import { DatesBars } from "@/components/dates/dates-bars";
import { DatesCard } from "@/components/dates/dates-card";
import { DatesPanel } from "@/components/dates/dates-panels";
import { DatesStubs, type DatesStub } from "@/components/dates/dates-stubs";
import { CalendarBelow, CalendarTop, useCalendarFill } from "@/components/days/calendar-fill";
import { forecastIndex, type ForecastIndex } from "@/components/days/dates-weather";
import { WEATHER_LOOK, type ForecastDay } from "@/components/days/weather-panel";
import { CalendarGlyph, GroupGlyph, TickGlyph, WeatherGlyph } from "@/components/system/glyphs";
import { useTheme } from "@/components/system/theme";
import { Button, Failed, Loading } from "@/components/system/ui";
import { BookingPanel } from "@/components/trip/booking-panel";
import { trpc } from "@/lib/api";
import { useSession } from "@/lib/auth";
import { dayLookOf, freeCounts, type DatesView } from "@/lib/dates/day-look";
import { nextRange, type DateRange } from "@/lib/dates/range";
import { fonts, size, space } from "@/lib/theme";
import { windowWarning } from "@/lib/trip/window-change";
import type { TripForecastView } from "@floc/api/port";
import type { AppRouter } from "@floc/api/router";
import type { inferRouterOutputs } from "@trpc/server";

type Outputs = inferRouterOutputs<AppRouter>;

/** The month to open on: the trip's own, else the earliest anybody marked, else this one (rule 9). */
function openingMonth(chosen: string | null, startDate: string | null, marked: string[]): string {
  if (chosen) return chosen;
  if (startDate) return monthOf(startDate);
  if (marked.length > 0) return monthOf([...marked].sort((a, b) => a.localeCompare(b))[0]);
  return thisMonth();
}

function bookingFor(trip: Outputs["trips"]["get"], days: Outputs["itinerary"]["days"] | undefined, files: Outputs["files"]["list"] | undefined) {
  return bookingPlan({
    trip,
    days: (days ?? []).map((d) => ({ ...d, dayId: d.id })),
    today: today(),
    adults: trip.members.length,
    prefill: trip.bookingPrefill,
    files: files ?? [],
  });
}

type Member = { userId: string; name: string };

/** Members and the invite link's guests (#442), each with how many days they can do. */
function peopleOf(members: Member[], guests: { id: string; name: string }[] | undefined, marked: { userId: string }[]) {
  return [
    ...members.map((m) => ({ id: m.userId, name: m.name, guest: false })),
    ...(guests ?? []).map((g) => ({ id: g.id, name: g.name, guest: true })),
  ].map((p) => ({ ...p, days: marked.filter((row) => row.userId === p.id).length }));
}

function tripDaysOf(start: string | null, end: string | null): string[] {
  return start && end ? dateRange(start, end) : [];
}

/** Only the trip's own days carry weather, as on the web (#148). */
function hiFor(tripDays: string[], byDate: Record<string, ForecastDay>) {
  return (date: string) => {
    const day = tripDays.includes(date) ? byDate[date] : undefined;
    return day ? { hi: day.hi, label: WEATHER_LOOK[day.condition].word } : undefined;
  };
}

function forecastFacts(view: TripForecastView | undefined, index: ForecastIndex, tripDays: string[]) {
  return {
    shown: index.offered,
    locked: view?.locked ?? false,
    tripDays: tripDays.length,
    days: tripDays.filter((d) => index.byDate[d]).length,
    horizonEnd: view?.forecast?.horizonEnd ?? null,
  };
}

function stubsFor(p: {
  mine: string[];
  unsaved: number;
  memberCount: number;
  waitingOn: string[];
  start: string | null;
  end: string | null;
  best: { start: string; end: string } | null;
  forecast: { shown: boolean; locked: boolean; tripDays: number; days: number; horizonEnd: string | null };
}): DatesStub[] {
  const stubs: DatesStub[] = [
    { key: "mine", name: "Your days", glyph: (c) => <TickGlyph color={c} />, summary: yourDaysTab(p.mine, p.unsaved) },
    { key: "group", name: "The group", glyph: (c) => <GroupGlyph color={c} />, summary: groupTab(p.memberCount, p.waitingOn) },
    { key: "trip", name: "The trip", glyph: (c) => <CalendarGlyph color={c} />, summary: tripTab(p.start, p.end, p.best) },
  ];
  const f = p.forecast;
  if (f.shown)
    stubs.push({
      key: "forecast",
      name: "Forecast, a Floc Pro feature",
      glyph: (c) => <WeatherGlyph condition="part" color={c} size={14} />,
      summary: f.locked
        ? { value: "Floc Pro", short: "Pro", note: "The weather on the trip's days", open: false }
        : forecastTab(f.tripDays, f.days, f.horizonEnd),
    });
  return stubs;
}

function DatesHead({ start, end, changing, folded, onToggle }: { start: string | null; end: string | null; changing: boolean; folded: boolean; onToggle: () => void }) {
  const { c } = useTheme();
  const nights = start && end ? nightsBetween(start, end) : null;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: c.ink, fontFamily: fonts.type, fontSize: size.body, fontVariant: ["tabular-nums"] }}>
          {start && end ? spanLabel(start, end) : formatDateRange(start, end)}
        </Text>
        {nights !== null ? (
          <Text style={{ color: c["ink-3"], fontFamily: fonts.type, fontSize: size.small, fontVariant: ["tabular-nums"] }}>{`${nights} ${nights === 1 ? "night" : "nights"}`}</Text>
        ) : null}
      </View>
      {folded ? <Button label={changing ? "Done" : "Change the dates"} variant="quiet" fit="small" onPress={onToggle} /> : null}
    </View>
  );
}

export default function Dates() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);
  // A screen keeps rendering for a frame while it leaves, and `id` is gone by then.
  const ready = Number.isFinite(tripId);
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: session } = useSession();

  const trip = useQuery(trpc.trips.get.queryOptions({ tripId }, { enabled: ready }));
  const rows = useQuery(trpc.availability.list.queryOptions({ tripId }, { enabled: ready }));
  const guests = useQuery(trpc.availability.guests.queryOptions({ tripId }, { enabled: ready }));
  const weather = useQuery(trpc.itinerary.forecast.queryOptions({ tripId }, { enabled: ready }));
  const days = useQuery(trpc.itinerary.days.queryOptions({ tripId }, { enabled: ready }));
  const files = useQuery(trpc.files.list.queryOptions({ tripId }, { enabled: ready }));
  const cal = useCalendarFill(tripId);

  const [view, setView] = useState<DatesView>("mine");
  const [changing, setChanging] = useState(false);
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [month, setMonth] = useState<string | null>(null);
  /** Local paint, over what the server said. Empty means nothing unsaved. */
  const [edits, setEdits] = useState<Record<string, boolean>>({});
  const [range, setRange] = useState<DateRange | null>(null);

  const saveMarks = useMutation({
    ...trpc.availability.set.mutationOptions(),
    onSuccess: () => {
      setEdits({});
      void queryClient.invalidateQueries({ queryKey: trpc.availability.list.queryKey({ tripId }) });
    },
  });
  const saveWindow = useMutation({
    ...trpc.trips.update.mutationOptions(),
    onSuccess: () => {
      setRange(null);
      void queryClient.invalidateQueries({ queryKey: trpc.trips.get.queryKey({ tripId }) });
    },
  });

  if (trip.isPending || rows.isPending) return <Loading />;
  if (trip.isError) return <Failed onRetry={() => trip.refetch()} />;
  if (rows.isError) return <Failed onRetry={() => rows.refetch()} />;

  const me = session?.user.id;
  const { startDate, endDate } = trip.data;
  const marked = rows.data.filter((row) => row.available);
  const shown = openingMonth(month, startDate, marked.map((row) => row.date));
  const mineSaved = marked.filter((row) => row.userId === me).map((row) => row.date);
  const mineOn = (date: string): boolean => edits[date] ?? mineSaved.includes(date);
  const unsaved = Object.keys(edits).length;

  const people = peopleOf(trip.data.members, guests.data, marked);
  const memberCount = people.length;
  const waitingOn = people.filter((p) => p.days === 0).map((p) => p.name);
  const best = bestWindow(rows.data);

  const forecast = forecastIndex(weather.data);
  const tripDays = tripDaysOf(startDate, endDate);
  const ctx = {
    view,
    counts: freeCounts(rows.data, me, edits),
    memberCount,
    tripStart: startDate,
    tripEnd: endDate,
    now: today(),
    isFree: mineOn,
    range: view === "trip" ? range : null,
    hiOf: hiFor(tripDays, forecast.byDate),
  };

  const stubs = stubsFor({
    mine: mineSaved,
    unsaved,
    memberCount,
    waitingOn,
    start: startDate,
    end: endDate,
    best,
    forecast: forecastFacts(weather.data, forecast, tripDays),
  });

  function paint(anchor: string, target: string) {
    if (view === "group") return;
    if (view === "forecast") {
      if (tripDays.includes(target) && forecast.byDate[target]) setOpenDay(target);
      return;
    }
    if (view === "trip") {
      setRange((current) => nextRange(current, anchor, target));
      return;
    }
    // The whole span takes the value the anchor is becoming, recomputed from the start of the drag.
    setEdits((current) => paintRange(current, anchor, target, !mineOn(anchor), dateRange));
  }

  function saveEdits() {
    // Two calls, because yes and no are two writes.
    const dates = Object.keys(edits);
    const on = dates.filter((date) => edits[date]);
    const off = dates.filter((date) => !edits[date]);
    if (on.length > 0) saveMarks.mutate({ tripId, dates: on, available: true });
    if (off.length > 0) saveMarks.mutate({ tripId, dates: off, available: false });
  }

  function setWindow(start: string | null, end: string | null) {
    const write = () => saveWindow.mutate({ tripId, startDate: start, endDate: end });
    const warning = windowWarning(days.data, start, end);
    if (!warning) return write();
    Alert.alert(warning.title, "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: warning.action, style: "destructive", onPress: write },
    ]);
  }

  const open = (next: DatesView) => {
    setView(next);
    setOpenDay(null);
  };
  const useBest = () => {
    if (!best) return;
    setRange({ start: best.start, end: best.end });
    setMonth(monthOf(best.start));
    open("trip");
  };

  const board = datesMoment(trip.data, today()) === "finding" || changing;
  const booking = bookingFor(trip.data, days.data, files.data);
  const fresh = mineSaved.length === 0 && unsaved === 0;

  const parts = {
    stubs: <DatesStubs stubs={stubs} open={view} onOpen={open} />,
    bar: (
      <DatesBars
        view={view}
        unsaved={unsaved}
        range={range}
        dated={startDate !== null}
        busy={{ marks: saveMarks.isPending, window: saveWindow.isPending }}
        onSave={saveEdits}
        onCommit={() => range && setWindow(range.start, range.end)}
        onDiscard={() => setRange(null)}
      />
    ),
    panel: (
      <DatesPanel
        view={view}
        trip={{ start: startDate, end: endDate }}
        isFree={mineOn}
        best={best}
        people={people}
        weather={{ view: weather.data, byDate: forecast.byDate, openDay }}
        onUseBest={useBest}
        onClear={() => setWindow(null, null)}
        onSeePro={() => router.push("/settings")}
      />
    ),
  };

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
      <DatesHead start={startDate} end={endDate} changing={changing} folded={datesMoment(trip.data, today()) !== "finding"} onToggle={() => {
        // Why: "Change the dates" opens the trip's dates, not your own days.
        if (!changing) open("trip");
        setChanging(!changing);
      }} />
      {board ? <CalendarTop cal={cal} show={view === "mine" && fresh} month={shown} /> : null}
      <DatesCard
        month={shown}
        onMonth={setMonth}
        look={(date) => dayLookOf(board ? ctx : { ...ctx, view: "group" }, date)}
        onPaint={paint}
        open={board ? parts : null}
      />
      {board ? <CalendarBelow cal={cal} show={view === "mine"} empty={fresh} month={shown} /> : null}
      {booking ? <BookingPanel tripId={tripId} plan={booking} onOpenDays={() => router.push(`/trip/${tripId}/days`)} /> : null}
    </ScrollView>
  );
}