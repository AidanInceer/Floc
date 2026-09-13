/**
 * Dates (ticket 297) — the screen that settles when a trip happens.
 *
 * ONE GRID, FOUR VIEWS, exactly as the web page does it:
 *   Mine     — paint the days you could go.
 *   Everyone — read-only, shaded and numbered by how many can.
 *   Window   — commit the trip's dates, dragged out of the same grid.
 *   Weather  — the forecast on the trip's own days. Pro, and says so when locked.
 *
 * UNDATED IS THE NORMAL STARTING STATE (rule 9). Nothing here treats a trip
 * with no dates as broken, and clearing the window is an ordinary thing to do,
 * not a destructive one.
 *
 * NOTHING WRITES UNTIL SAVE. A drag builds up local edits and one action sends
 * them — a round trip per day would be slower and a worse story on a patchy
 * phone connection.
 *
 * NO TIMEZONES ANYWHERE (rule 10). Every date on this screen is a
 * `YYYY-MM-DD` string, from first touch to the wire.
 *
 * YOU ANSWER ONLY FOR YOURSELF. There is no control here to mark somebody
 * else's days and the API has no parameter for it — an admin who could answer
 * for the group would make the answer worthless (rule 6).
 */
import {
  addMonths,
  formatMonth,
  monthOf,
  tally,
  thisMonth,
  type Tally,
} from "@floc/core/dates/availability";
import { paintRange, pickedRange } from "@floc/core/dates/calendar-gestures";
import { dateRange, formatDateRange, today } from "@floc/core/dates/dates";
import { bookingPlan } from "@floc/core/trip/booking-links";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";

import { DatesWeather, forecastIndex } from "@/components/days/dates-weather";
import { BookingPanel } from "@/components/trip/booking-panel";
import { MonthGrid, type CellLook } from "@/components/days/month-grid";
import { WEATHER_LOOK, type ForecastDay } from "@/components/days/weather-panel";
import {
  Body,
  Button,
  Card,
  Failed,
  Figure,
  Heading,
  Label,
  Loading,
  Segmented,
} from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { useSession } from "@/lib/auth";
import { space } from "@/lib/theme";

/** Which of the four readings of the same grid is on screen. */
type CalendarView = "mine" | "everyone" | "window" | "weather";

const VIEWS: { value: CalendarView; label: string }[] = [
  { value: "mine", label: "Mine" },
  { value: "everyone", label: "Everyone" },
  { value: "window", label: "The dates" },
];

const WITH_WEATHER: { value: CalendarView; label: string }[] = [
  ...VIEWS,
  { value: "weather", label: "Weather" },
];

const NOTHING: CellLook = { ground: null, ink: null, count: null, ringed: false };

type Marks = { start: string | null; end: string | null };

/**
 * How one day should read, in whichever view is on. Pure, and outside the
 * component so the three answers can be seen side by side.
 *
 * Every shaded day also carries a number or a ring, so the shading is never
 * the only thing saying it (#204).
 */
function cellLook(
  view: CalendarView,
  date: string,
  state: {
    mineOn: (date: string) => boolean;
    counts: Map<string, Tally>;
    memberCount: number;
    windowDays: Set<string>;
    forecast: Record<string, ForecastDay>;
  },
): CellLook {
  if (view === "weather") {
    // Only the trip's own days carry weather, as on the web (#148).
    const inTrip = state.windowDays.has(date);
    const day = inTrip ? state.forecast[date] : undefined;
    if (!day) return { ...NOTHING, ringed: inTrip };
    const look = WEATHER_LOOK[day.condition];
    return {
      ground: look.ground,
      ink: look.ink,
      count: day.hi,
      countLabel: `${look.word}, high of ${day.hi} degrees`,
      ringed: true,
    };
  }

  if (view === "mine") {
    return state.mineOn(date)
      ? { ground: "mint", ink: "mint-ink", count: null, ringed: false }
      : NOTHING;
  }

  if (view === "everyone") {
    const free = state.counts.get(date)?.free ?? 0;
    if (free === 0) return NOTHING;
    return free === state.memberCount
      ? { ground: "mint", ink: "mint-ink", count: free, ringed: false }
      : { ground: "butter", ink: "butter-ink", count: free, ringed: false };
  }

  return state.windowDays.has(date)
    ? { ground: "peri", ink: "peri-ink", count: null, ringed: true }
    : NOTHING;
}

/**
 * The month to open on: the trip's own, else the earliest month anybody has
 * marked, else this one. A trip with none of those is not a problem to report
 * — it is simply new (rule 9).
 */
function openingMonth(
  chosen: string | null,
  startDate: string | null,
  markedDates: string[],
): string {
  if (chosen) return chosen;
  if (startDate) return monthOf(startDate);
  if (markedDates.length > 0) return monthOf([...markedDates].sort()[0]);
  return thisMonth();
}

/** The days to ring: the range being dragged out, else the trip's own, else none. */
function windowSet(range: Marks, startDate: string | null, endDate: string | null): Set<string> {
  if (range.start && range.end) return new Set(dateRange(range.start, range.end));
  if (startDate && endDate) return new Set(dateRange(startDate, endDate));
  return new Set();
}

/** Who still owes an answer — the one thing shading cannot say. */
function answeredLine(
  members: { userId: string; name: string }[],
  rows: { userId: string; available: boolean }[],
): string {
  const answered = new Set(rows.filter((row) => row.available).map((row) => row.userId));
  const waiting = members.filter((member) => !answered.has(member.userId));
  if (waiting.length === 0) return "Everyone has said when they are free.";
  return `Still to answer: ${waiting.map((member) => member.name).join(", ")}.`;
}

function MinePanel({
  unsaved,
  busy,
  onSave,
}: {
  unsaved: boolean;
  busy: boolean;
  onSave: () => void;
}) {
  return (
    <View style={{ gap: space.sm }}>
      <Label>Your days</Label>
      <Body tone="ink-2">Drag across the days you could go. Nothing is sent until you save.</Body>
      <Button
        label={unsaved ? "Save your days" : "Nothing to save"}
        disabled={!unsaved}
        busy={busy}
        onPress={onSave}
      />
    </View>
  );
}

function WindowPanel({
  halfMade,
  ready,
  busy,
  dated,
  onSet,
  onClear,
}: {
  halfMade: boolean;
  ready: boolean;
  busy: boolean;
  dated: boolean;
  onSet: () => void;
  onClear: () => void;
}) {
  return (
    <View style={{ gap: space.sm }}>
      <Label>The trip&apos;s dates</Label>
      <Body tone="ink-2">
        {halfMade ? "Now drag to the last day." : "Drag across the days the trip runs."}
      </Body>
      <Button label="Set these dates" disabled={!ready} busy={busy} onPress={onSet} />
      {dated ? (
        <Button label="Clear the dates" variant="quiet" busy={busy} onPress={onClear} />
      ) : null}
    </View>
  );
}

export default function Dates() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);
  // A screen keeps rendering for a frame while it leaves, and `id` is gone by
  // then: NaN goes down the wire as null and the server rightly refuses it.
  const ready = Number.isFinite(tripId);
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: session } = useSession();

  const trip = useQuery(trpc.trips.get.queryOptions({ tripId }, { enabled: ready }));
  const rows = useQuery(trpc.availability.list.queryOptions({ tripId }, { enabled: ready }));
  const weather = useQuery(trpc.itinerary.forecast.queryOptions({ tripId }, { enabled: ready }));
  const days = useQuery(trpc.itinerary.days.queryOptions({ tripId }, { enabled: ready }));

  const [view, setView] = useState<CalendarView>("mine");
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [month, setMonth] = useState<string | null>(null);
  /** Local paint, over what the server said. Empty means nothing unsaved. */
  const [edits, setEdits] = useState<Record<string, boolean>>({});
  const [range, setRange] = useState<Marks>({ start: null, end: null });

  const saveMarks = useMutation({
    ...trpc.availability.set.mutationOptions(),
    onSuccess: () => {
      setEdits({});
      queryClient.invalidateQueries({
        queryKey: trpc.availability.list.queryKey({ tripId }),
      });
    },
  });

  const saveWindow = useMutation({
    ...trpc.trips.update.mutationOptions(),
    onSuccess: () => {
      setRange({ start: null, end: null });
      queryClient.invalidateQueries({ queryKey: trpc.trips.get.queryKey({ tripId }) });
    },
  });

  if (trip.isPending || rows.isPending) return <Loading />;
  if (trip.isError) return <Failed onRetry={() => trip.refetch()} />;
  if (rows.isError) return <Failed onRetry={() => rows.refetch()} />;

  const me = session?.user.id;
  const marked = rows.data.filter((row) => row.available);

  const shown = openingMonth(
    month,
    trip.data.startDate,
    marked.map((row) => row.date),
  );

  /** What the server says about my own day, unless I have painted over it. */
  const mineOn = (date: string): boolean =>
    edits[date] ?? marked.some((row) => row.userId === me && row.date === date);

  const windowDays = windowSet(range, trip.data.startDate, trip.data.endDate);

  const booking = bookingPlan({
    trip: trip.data,
    days: (days.data ?? []).map((d) => ({ ...d, dayId: d.id })),
    today: today(),
    adults: trip.data.members.length,
  });

  const forecast = forecastIndex(weather.data);
  const forecastByDate = forecast.byDate;

  const look = (date: string) =>
    cellLook(view, date, {
      mineOn,
      counts: tally(rows.data),
      memberCount: trip.data.members.length,
      windowDays,
      forecast: forecastByDate,
    });

  function paint(anchor: string, target: string) {
    if (view === "everyone") return;
    if (view === "weather") {
      if (windowDays.has(target) && forecastByDate[target]) setOpenDay(target);
      return;
    }
    if (view === "window") {
      setRange(pickedRange(anchor, target));
      return;
    }
    // The whole span takes the value the anchor is *becoming*, recomputed from
    // the start of the drag each move, so a fast drag leaves no holes.
    setEdits((current) => paintRange(current, anchor, target, !mineOn(anchor), dateRange));
  }

  function saveEdits() {
    // Two calls, because yes and no are two writes. A day dragged on and off
    // again is still sent, and lands as the "no" it now is.
    const dates = Object.keys(edits);
    const on = dates.filter((date) => edits[date]);
    const off = dates.filter((date) => !edits[date]);
    if (on.length > 0) saveMarks.mutate({ tripId, dates: on, available: true });
    if (off.length > 0) saveMarks.mutate({ tripId, dates: off, available: false });
  }

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
      <View style={{ gap: space.xs }}>
        <Heading>When</Heading>
        <Figure tone="ink-2">
          {formatDateRange(trip.data.startDate, trip.data.endDate)}
        </Figure>
      </View>

      <Segmented options={forecast.offered ? WITH_WEATHER : VIEWS} value={view} onChange={setView} />

      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
          <Button label="‹" onPress={() => setMonth(addMonths(shown, -1))} variant="quiet" />
          <View style={{ flex: 1, alignItems: "center" }}>
            <Body bold>{formatMonth(shown)}</Body>
          </View>
          <Button label="›" onPress={() => setMonth(addMonths(shown, 1))} variant="quiet" />
        </View>

        <MonthGrid month={shown} look={look} onPaint={paint} onRelease={() => {}} />
      </Card>

      {view === "mine" ? (
        <MinePanel
          unsaved={Object.keys(edits).length > 0}
          busy={saveMarks.isPending}
          onSave={saveEdits}
        />
      ) : null}

      {view === "everyone" ? (
        <View style={{ gap: space.sm }}>
          <Label>Who has answered</Label>
          <Body tone="ink-2">{answeredLine(trip.data.members, rows.data)}</Body>
        </View>
      ) : null}

      {view === "window" ? (
        <WindowPanel
          halfMade={range.start !== null && range.end === null}
          ready={range.start !== null && range.end !== null}
          busy={saveWindow.isPending}
          dated={trip.data.startDate !== null}
          onSet={() =>
            saveWindow.mutate({ tripId, startDate: range.start, endDate: range.end })
          }
          onClear={() => saveWindow.mutate({ tripId, startDate: null, endDate: null })}
        />
      ) : null}

      {view === "weather" ? (
        <DatesWeather
          view={weather.data}
          byDate={forecastByDate}
          openDay={openDay}
          onSeePro={() => router.push("/settings")}
        />
      ) : null}

      {booking ? (
        <BookingPanel plan={booking} onOpenDays={() => router.push(`/trip/${tripId}/days`)} />
      ) : null}
    </ScrollView>
  );
}
