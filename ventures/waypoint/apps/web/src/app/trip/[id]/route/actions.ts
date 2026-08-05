"use server";

/**
 * Route mutations (ticket 15). Route edits are itinerary edits — same `day`
 * rows Days uses — so every write here is really "create/edit day rows and
 * their overnight place", not a separate "stop" entity (there isn't one).
 * Open to all members, not admin-only (ticket 01 step 7).
 *
 * The SQL moved to `server/itinerary.ts` (ticket 108). What's left here is the
 * Route tab's *meaning*: what a stop is, what moving one does to the dates, and
 * how the travel between two stops survives a reorder.
 */
import { requireTripAccess } from "@/server/access";
import { dateRange, isIsoDate } from "@/lib/dates";
import { upsertPlace } from "@/server/places";
import {
  firstTransportEvents,
  listDays,
  moveEventToDay,
  moveItem,
  overnightPlaceOf,
  permuteDayContents,
  revalidateItinerary,
  setLegTransportOn,
  setOvernightPlaceOn,
  writeSpan,
} from "@/server/itinerary";
import { deriveStops } from "@/lib/stops";
import type { TransportType } from "@/db/schema";

/**
 * Adds a stop by creating (or re-pointing) `day` rows for a date span.
 * Dates already covered by an existing day are updated in place rather than
 * duplicated — `day` has a unique (trip, date) index.
 */
export async function addStop(
  tripId: number,
  input: {
    startDate: string;
    endDate: string;
    placeName: string;
    providerId?: string | null;
    lat?: number | null;
    lng?: number | null;
    countryCode?: string | null;
  },
) {
  const access = await requireTripAccess(tripId);
  // `dateRange` walks day by day from the start, so a non-date start is not a
  // wrong answer but an unbounded loop (ticket 113).
  if (!isIsoDate(input.startDate) || !isIsoDate(input.endDate)) return;
  if (input.endDate < input.startDate) return;

  const placeId = await upsertPlace({
    providerId: input.providerId ?? null,
    name: input.placeName,
    lat: input.lat,
    lng: input.lng,
    countryCode: input.countryCode,
  });

  await writeSpan(access.trip.id, dateRange(input.startDate, input.endDate), placeId);

  revalidateItinerary(access.trip.id);
}

/** Changes the overnight place for one or more existing day rows. */
export async function setOvernightPlace(
  tripId: number,
  dayIds: number[],
  input: {
    placeName: string;
    providerId?: string | null;
    lat?: number | null;
    lng?: number | null;
    countryCode?: string | null;
  },
) {
  const access = await requireTripAccess(tripId);
  const placeId = await upsertPlace({
    providerId: input.providerId ?? null,
    name: input.placeName,
    lat: input.lat,
    lng: input.lng,
    countryCode: input.countryCode,
  });

  await setOvernightPlaceOn(access.trip.id, dayIds, placeId);

  revalidateItinerary(access.trip.id);
}

/**
 * Moves a stop to a different date span, keeping its place.
 *
 * "Reordering" a stop is really re-dating it — a stop is derived from
 * consecutive days sharing an overnight place (rule 3), so there is no stored
 * row to drag. This clears the place off the days the stop used to cover and
 * writes it onto the days the new span covers, creating any that don't exist.
 * Days that appear in both spans are simply rewritten, so shrinking a stop by
 * a night doesn't churn the days it keeps.
 *
 * Last-write-wins (rule 7): if the new span overlaps a *neighbouring* stop,
 * this takes those days. That's the honest outcome of "these dates are now
 * Lisbon" — the two stops merge into one on the next render.
 */
export async function setStopDates(
  tripId: number,
  dayIds: number[],
  input: { startDate: string; endDate: string },
) {
  const access = await requireTripAccess(tripId);
  if (!isIsoDate(input.startDate) || !isIsoDate(input.endDate)) return;
  if (input.endDate < input.startDate) return;

  const placeId = await overnightPlaceOf(access.trip.id, dayIds);

  await setOvernightPlaceOn(access.trip.id, dayIds, null);
  await writeSpan(access.trip.id, dateRange(input.startDate, input.endDate), placeId);

  revalidateItinerary(access.trip.id);
}

/**
 * Drops a stop into a different position in the sequence.
 *
 * There is no stored row to drag (rule 3), so this permutes what happens on
 * the trip's dates: the stops are re-laid over the same run of days in the new
 * order, each keeping its own number of nights and taking whatever dates that
 * lands it on. A two-night stop moved in front of a three-night one therefore
 * changes both stops' dates — which is the point of moving it.
 *
 * Events travel with their stop; expenses stay on their date. See
 * src/server/itinerary.ts for why.
 */
export async function reorderStops(tripId: number, from: number, to: number) {
  const access = await requireTripAccess(tripId);

  const days = await listDays(access.trip.id);

  const stops = deriveStops(
    days.map((d) => ({
      dayId: d.id,
      date: d.date,
      overnightPlaceId: d.overnightPlaceId,
      overnightPlaceName: null,
    })),
  );

  const legs = await loadLegEvents(stops);
  const next = moveItem(stops, from, to);

  await permuteDayContents(access.trip.id, next.flatMap((s) => s.dayIds));
  await reanchorLegEvents(stops, next, days.map((d) => d.id), legs);

  revalidateItinerary(access.trip.id);
}

/**
 * The travel between two stops belongs to the *pair*, not to either end
 * (ticket 82). The event itself lives on the arrival stop's first day, so a
 * plain permute carries it off with whichever stop it happened to be sitting
 * on: swap Madrid and Lisbon and the car that joined them arrives at the top
 * of the trip, where there is nothing before it to travel from — the leg looks
 * as though it lost its mode.
 *
 * So a reorder records the legs first, then re-anchors them afterwards: any
 * pair of stops still next to each other keeps its travel, on whichever of the
 * two is now second. A pair pulled apart doesn't — its event stays with the
 * stop it was on, which is the only other place it could honestly go.
 *
 * Nothing about this needs a column of its own. The mode is still exactly
 * `day_event.transport_type`; what a reorder fixes up is which day the row
 * hangs off, and a `leg` table would be the stored "stop" rule 3 rules out,
 * one relationship further along.
 */
const pairKey = (a: number, b: number) =>
  `${Math.min(a, b)}-${Math.max(a, b)}`;

/** First transport event on each stop's first day, keyed by the pair it joins. */
async function loadLegEvents(stops: { dayIds: number[] }[]) {
  const legs = new Map<string, number>();
  const firstByDay = await firstTransportEvents(
    stops.slice(1).map((s) => s.dayIds[0]),
  );
  if (firstByDay.size === 0) return legs;

  for (const [i, stop] of stops.entries()) {
    if (i === 0) continue;
    const eventId = firstByDay.get(stop.dayIds[0]);
    if (eventId) legs.set(pairKey(i - 1, i), eventId);
  }
  return legs;
}

/** Moves each surviving leg's event onto the day its arrival stop now starts on. */
async function reanchorLegEvents(
  stops: { dayIds: number[] }[],
  next: { dayIds: number[] }[],
  /** The trip's live day ids, in date order — dates don't move, contents do. */
  dayIdsByDate: number[],
  legs: Map<string, number>,
) {
  if (legs.size === 0) return;

  const positionOf = new Map(stops.map((s, i) => [s, i]));
  const writes: Promise<unknown>[] = [];
  let offset = 0;

  for (const [k, stop] of next.entries()) {
    if (k > 0) {
      const key = pairKey(positionOf.get(next[k - 1])!, positionOf.get(stop)!);
      const eventId = legs.get(key);
      const arrivalDayId = dayIdsByDate[offset];
      if (eventId && arrivalDayId) writes.push(moveEventToDay(eventId, arrivalDayId));
    }
    offset += stop.dayIds.length;
  }

  await Promise.all(writes);
}

/**
 * Removes a stop: clears the overnight place on its days but keeps the `day`
 * rows themselves — the days still exist on the itinerary, just unplaced.
 */
export async function removeStop(tripId: number, dayIds: number[]) {
  const access = await requireTripAccess(tripId);
  await setOvernightPlaceOn(access.trip.id, dayIds, null);
  revalidateItinerary(access.trip.id);
}

/**
 * Sets how the group gets to a stop (ticket 82). The mode is not stored on the
 * route — a stop isn't stored at all (rule 3) — so this writes the same
 * `day_event` row Days owns; `setLegTransportOn` holds the two deliberate
 * limits on that (re-type only, and no "clear").
 */
export async function setLegTransport(
  tripId: number,
  dayId: number,
  mode: TransportType,
) {
  const access = await requireTripAccess(tripId);
  await setLegTransportOn(access.trip.id, dayId, mode);
  revalidateItinerary(access.trip.id);
}

/* ------------------------------------------------- what the forms post */
/*
 * Route's three forms used to parse their own FormData inside an inline
 * `"use server"` closure on the page, against the convention that a mutation
 * lives in its route folder's `actions.ts` (ticket 117, S11). These are those
 * closures, moved: the page binds the ids each one needs and the parsing lands
 * here beside the rule it feeds.
 */

/** The place fields `<PlacePicker>` posts, in one shape. */
function readPlaceFields(formData: FormData) {
  const lat = formData.get("placeLat");
  const lng = formData.get("placeLng");
  return {
    placeName: String(formData.get("placeName") ?? ""),
    providerId: String(formData.get("placeProviderId") ?? "") || null,
    lat: lat ? Number(lat) : null,
    lng: lng ? Number(lng) : null,
    countryCode: String(formData.get("placeCountryCode") ?? "") || null,
  };
}

export async function submitNewStop(tripId: number, formData: FormData) {
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const place = readPlaceFields(formData);
  if (!startDate || !endDate || !place.placeName) return;

  await addStop(tripId, { startDate, endDate, ...place });
}

export async function submitStopDates(
  tripId: number,
  dayIds: number[],
  formData: FormData,
) {
  await setStopDates(tripId, dayIds, {
    startDate: String(formData.get("startDate") ?? ""),
    endDate: String(formData.get("endDate") ?? ""),
  });
}

export async function submitStopPlace(
  tripId: number,
  dayIds: number[],
  formData: FormData,
) {
  const place = readPlaceFields(formData);
  if (!place.placeName) return;

  await setOvernightPlace(tripId, dayIds, place);
}
