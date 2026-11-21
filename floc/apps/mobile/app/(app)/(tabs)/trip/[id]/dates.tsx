import { daysInMonth, freeDaysByUser, monthOf, thisMonth } from "@floc/core/dates/availability";
import { dateRange, formatDateRange, nightsBetween, today } from "@floc/core/dates/dates";
import { datesMoment } from "@floc/core/dates/dates-moment";
import { forecastTab, groupTab, spanLabel, tripTab, yourDaysTab, type GroupAnswer } from "@floc/core/dates/dates-tabs";
import type { PaintMode } from "@floc/core/dates/finding/day-paint";
import type { LengthChoice } from "@floc/core/dates/finding/trip-length";
import { bookingPlan } from "@floc/core/trip/booking/booking-links";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";

import { BestDatesCard } from "@/components/dates/best-dates-card";
import { DatesBars } from "@/components/dates/dates-bars";
import { DatesCard } from "@/components/dates/dates-card";
import { DatesPanel } from "@/components/dates/dates-panels";
import { NudgeWord } from "@/components/trip/nudge/nudge-word";
import { DatesStubs, type DatesStub } from "@/components/dates/dates-stubs";
import { LengthTiles } from "@/components/dates/length-tiles";
import { MarkSwitch } from "@/components/dates/mark-bar";
import { CalendarBelow, CalendarTop, useCalendarFill } from "@/components/days/calendar-fill";
import { forecastIndex, type ForecastIndex } from "@/components/days/dates-weather";
import { WEATHER_LOOK, type ForecastDay } from "@/components/days/weather-panel";
import { CalendarGlyph, GroupGlyph, TickGlyph, WeatherGlyph } from "@/components/system/glyphs";
import { useTheme } from "@/components/system/theme";
import { Button, Failed, Loading } from "@/components/system/ui";
import { BookingPanel } from "@/components/trip/booking-panel";
import { trpc } from "@/lib/api";
import { useSession } from "@/lib/auth";
import { bestWindows, type BestWindow } from "@/lib/dates/best-windows";
import { answeredCount, dayLookOf, freeCounts, preferCounts, storedMarks, type DatesView } from "@/lib/dates/day-look";
import { useDayPaint } from "@/lib/dates/use-day-paint";
import { useSaveMarks } from "@/lib/dates/use-save-marks";
import { nextRange, type DateRange } from "@/lib/dates/range";
import { fonts, size, space } from "@/lib/theme";
import { windowWarning } from "@/lib/trip/window-change";
import type { TripForecastView } from "@floc/api/port";
import type { AppRouter } from "@floc/api/router";
import type { inferRouterOutputs } from "@trpc/server";
import { countWord } from "@floc/core/text/count-word";

type Outputs = inferRouterOutputs<AppRouter>;

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

function peopleOf(members: Member[], guests: { id: string; name: string }[] | undefined, freeDays: Partial<Record<string, number>>) {
  return [
    ...members.map((m) => ({ id: m.userId, name: m.name, guest: false })),
    ...(guests ?? []).map((g) => ({ id: g.id, name: g.name, guest: true })),
  ].map((p) => ({ ...p, days: freeDays[p.id] ?? null }));
}

function tripDaysOf(start: string | null, end: string | null): string[] {
  return start && end ? dateRange(start, end) : [];
}

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
  group: GroupAnswer[];
  viewerId: string | undefined;
  start: string | null;
  end: string | null;
  best: { start: string; end: string } | null;
  forecast: { shown: boolean; locked: boolean; tripDays: number; days: number; horizonEnd: string | null };
}): DatesStub[] {
  const stubs: DatesStub[] = [
    { key: "mine", name: "Your days", glyph: (c) => <TickGlyph color={c} />, summary: yourDaysTab(p.mine, p.unsaved, p.group.some((g) => g.id === p.viewerId && g.answered)) },
    { key: "group", name: "The group", glyph: (c) => <GroupGlyph color={c} />, summary: groupTab(p.group, p.viewerId) },
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
          <Text style={{ color: c["ink-3"], fontFamily: fonts.type, fontSize: size.small, fontVariant: ["tabular-nums"] }}>{countWord(nights, "night")}</Text>
        ) : null}
      </View>
      {folded ? <Button label={changing ? "Done" : "Change the dates"} variant="quiet" fit="small" onPress={onToggle} /> : null}
    </View>
  );
}

function shownWindow(windows: BestWindow[], at: number, start: string | null, end: string | null) {
  const index = Math.max(0, Math.min(at, windows.length - 1));
  const best = windows[index] ?? null;
  return {
    best,
    index,
    current: !!best && best.start === start && best.end === end,
  };
}

function MineLead({ show, mode, onMode }: { show: boolean; mode: PaintMode; onMode: (mode: PaintMode) => void }) {
  return show ? <MarkSwitch mode={mode} onMode={onMode} /> : null;
}

function DatesHeadMarks(p: { show: boolean; tripId: number; me: string | undefined; choices: LengthChoice[] | undefined }) {
  if (!p.show || !p.me || !p.choices) return null;
  return <LengthTiles tripId={p.tripId} viewerId={p.me} choices={p.choices} />;
}

export default function Dates() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);
  const ready = Number.isFinite(tripId);
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: session } = useSession();

  const trip = useQuery(trpc.trips.get.queryOptions({ tripId }, { enabled: ready }));
  const rows = useQuery(trpc.availability.list.queryOptions({ tripId }, { enabled: ready }));
  const guests = useQuery(trpc.availability.guests.queryOptions({ tripId }, { enabled: ready }));
  const nudges = useQuery(trpc.nudges.targets.queryOptions({ tripId }, { enabled: ready }));
  const weather = useQuery(trpc.itinerary.forecast.queryOptions({ tripId }, { enabled: ready }));
  const days = useQuery(trpc.itinerary.days.queryOptions({ tripId }, { enabled: ready }));
  const files = useQuery(trpc.files.list.queryOptions({ tripId }, { enabled: ready }));
  const lengths = useQuery(trpc.availability.lengths.queryOptions({ tripId }, { enabled: ready }));
  const cal = useCalendarFill(tripId);

  const [view, setView] = useState<DatesView>("mine");
  const [changing, setChanging] = useState(false);
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [month, setMonth] = useState<string | null>(null);
  const [range, setRange] = useState<DateRange | null>(null);
  const [bestAt, setBestAt] = useState(0);
  const painter = useDayPaint();

  const saveMarks = useSaveMarks(tripId, painter.clear);
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
  const stored = storedMarks(rows.data, me);
  const markOf = (date: string) => painter.edits[date] ?? stored(date);
  const diff = painter.diff(stored);
  const unsaved = diff.changed;

  const people = peopleOf(trip.data.members, guests.data, freeDaysByUser(rows.data));
  const memberCount = people.length;
  const group = people.map((p) => ({ id: p.id, name: p.name, answered: p.days !== null }));
  const names = new Map(people.map((p) => [p.id, p.name] as const));
  const windows = bestWindows(rows.data, lengths.data ?? [], today(), (userId) => names.get(userId), me);
  const shownBest = shownWindow(windows, bestAt, startDate, endDate);
  const { best, index: bestIndex } = shownBest;

  const forecast = forecastIndex(weather.data);
  const tripDays = tripDaysOf(startDate, endDate);
  const ctx = {
    view,
    counts: freeCounts(rows.data, me, painter.edits),
    memberCount,
    tripStart: startDate,
    tripEnd: endDate,
    now: today(),
    markOf,
    prefers: preferCounts(rows.data, me, markOf),
    answered: answeredCount(people, me, mineSaved.length + diff.add.length > diff.remove.length),
    range: view === "trip" ? range : null,
    hiOf: hiFor(tripDays, forecast.byDate),
  };

  const stubs = stubsFor({
    mine: mineSaved,
    unsaved,
    group,
    viewerId: me,
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
    painter.press(anchor, target, markOf);
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
    head: (
      <DatesHeadMarks show={view === "mine"} tripId={tripId} me={me} choices={lengths.data} />
    ),
    lead: <MineLead show={view === "mine"} mode={painter.mode} onMode={painter.setMode} />,
    bar: (
      <DatesBars
        view={view}
        unsaved={unsaved}
        range={range}
        dated={startDate !== null}
        busy={{ marks: saveMarks.isPending, window: saveWindow.isPending }}
        onSave={() => saveMarks.mutate(diff)}
        onFill={() => painter.fill(markOf, daysInMonth(shown).filter((date) => date >= today()))}
        onCommit={() => range && setWindow(range.start, range.end)}
        onDiscard={() => setRange(null)}
      />
    ),
    panel: (
      <DatesPanel
        view={view}
        trip={{ start: startDate, end: endDate }}
        isFree={(date) => markOf(date) !== "off"}
        bestCard={
          <BestDatesCard
            windows={windows}
            at={bestIndex}
            onStep={(delta) => setBestAt((bestIndex + delta + windows.length) % windows.length)}
            current={shownBest.current}
            onSet={useBest}
          />
        }
        people={people}
        nudgeFor={(id) => {
          const person = nudges.data?.dates.find((n) => n.userId === id);
          return person ? <NudgeWord tripId={tripId} task="dates" person={person} /> : null;
        }}
        weather={{ view: weather.data, byDate: forecast.byDate, openDay }}
        onClear={() => setWindow(null, null)}
        onSeePro={() => router.push("/settings")}
      />
    ),
  };

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
      <DatesHead start={startDate} end={endDate} changing={changing} folded={datesMoment(trip.data, today()) !== "finding"} onToggle={() => {
        if (!changing) open("trip");
        setChanging(!changing);
      }} />
      {board ? <CalendarTop cal={cal} show={view === "mine" && fresh} month={shown} /> : null}
      <DatesCard
        month={shown}
        onMonth={setMonth}
        look={(date) => dayLookOf(board ? ctx : { ...ctx, view: "group" }, date)}
        onPaint={paint}
        onRelease={painter.release}
        open={board ? parts : null}
      />
      {board ? <CalendarBelow cal={cal} show={view === "mine"} empty={fresh} month={shown} /> : null}
      {booking ? <BookingPanel tripId={tripId} plan={booking} onOpenDays={() => router.push(`/trip/${tripId}/days`)} /> : null}
    </ScrollView>
  );
}