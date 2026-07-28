"use server";

/**
 * Day/day_event mutations (ticket 15). Open to all members, not admin-only
 * (ticket 01 step 7). Blanket last-write-wins (ticket 12) — no version check
 * before any update; `touch()` just keeps `last_modified_at` current for
 * debugging.
 */
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { day, dayEvent } from "@/db/schema";
import type { DayEventType, TransportType } from "@/db/schema";
import { requireTripAccess } from "@/lib/access";
import { addDays as addDaysToDate } from "@/lib/dates";
import { moveItem, permuteDayContents } from "@/lib/itinerary";
import { searchPlaces, upsertPlace } from "@/lib/geocoding";
import { refreshUnlocks, touch } from "@/lib/unlocks";

/** Server-action wrapper — see route/actions.ts's twin for why this exists. */
export async function searchPlacesAction(query: string) {
  return searchPlaces(query);
}

/** Resolves a free-text or geocoded place into a `place.id` for an event. */
export async function resolveEventPlace(input: {
  providerId: string | null;
  name: string;
  lat: number | null;
  lng: number | null;
}) {
  if (!input.name.trim()) return null;
  return upsertPlace(input);
}

/**
 * Drops a day into a different position in the itinerary.
 *
 * The dates don't move — the *plan* does. Day rows are keyed by (trip, date),
 * so "swap Tuesday and Wednesday" means Wednesday's overnight place and events
 * now happen on Tuesday's date and vice versa. Expenses stay on the date they
 * were spent; see src/lib/itinerary.ts.
 */
export async function reorderDays(tripId: number, from: number, to: number) {
  const access = await requireTripAccess(tripId);

  const days = await db
    .select({ id: day.id })
    .from(day)
    .where(and(eq(day.tripId, access.trip.id), isNull(day.deletedAt)))
    .orderBy(asc(day.date))
    .all();

  await permuteDayContents(
    access.trip.id,
    moveItem(days.map((d) => d.id), from, to),
  );

  revalidatePath(`/trip/${access.trip.id}/days`);
  revalidatePath(`/trip/${access.trip.id}/route`);
}

/** Extends the trip by appending N days after its current last day. */
export async function addDays(tripId: number, afterDate: string, count: number) {
  const access = await requireTripAccess(tripId);
  const dates: string[] = [];
  let cursor = afterDate;
  for (let i = 0; i < count; i++) {
    cursor = addDaysToDate(cursor, 1);
    dates.push(cursor);
  }

  // One read for the whole span and one insert for whatever's missing, rather
  // than a select-then-insert per day. The existence check is deliberately
  // *not* filtered on `deletedAt`: a soft-deleted row still occupies the
  // (trip, date) unique index, so skipping it is what keeps this idempotent.
  if (dates.length) {
    const existing = await db
      .select({ date: day.date })
      .from(day)
      .where(and(eq(day.tripId, access.trip.id), inArray(day.date, dates)))
      .all();

    const covered = new Set(existing.map((d) => d.date));
    const missing = dates.filter((d) => !covered.has(d));
    if (missing.length) {
      await db
        .insert(day)
        .values(missing.map((date) => ({ tripId: access.trip.id, date })));
    }
  }

  await refreshUnlocks(access.trip.id);
  revalidatePath(`/trip/${access.trip.id}/days`);
  revalidatePath(`/trip/${access.trip.id}/route`);
}

/** Soft-deletes a single day row (and its events cascade via FK on hard delete only — soft-delete is app-level, so events are left orphaned-but-hidden by the day's own deletedAt check in queries). */
export async function removeDay(tripId: number, dayId: number) {
  const access = await requireTripAccess(tripId);
  await db
    .update(day)
    .set({ deletedAt: new Date(), ...touch() })
    .where(and(eq(day.id, dayId), eq(day.tripId, access.trip.id)));
  revalidatePath(`/trip/${access.trip.id}/days`);
  revalidatePath(`/trip/${access.trip.id}/route`);
}

/*
 * No `setDayNotes`: the per-day notes box is gone, along with `day.notes`.
 * Notes belong to the thing they describe — an event has `note` for its details
 * and a `note`-table thread for the conversation about it.
 */

export async function addEvent(
  tripId: number,
  dayId: number,
  input: {
    type: DayEventType;
    placeId?: number | null;
    transportType?: TransportType | null;
    time?: string | null;
    note?: string | null;
  },
) {
  const access = await requireTripAccess(tripId);

  const [{ count } = { count: 0 }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(dayEvent)
    .where(and(eq(dayEvent.dayId, dayId), isNull(dayEvent.deletedAt)));

  await db.insert(dayEvent).values({
    dayId,
    orderIndex: count,
    type: input.type,
    placeId: input.placeId ?? null,
    transportType: input.type === "transport" ? input.transportType ?? null : null,
    time: input.time || null,
    note: input.note || null,
  });

  revalidatePath(`/trip/${access.trip.id}/days`);
}

export async function updateEvent(
  tripId: number,
  eventId: number,
  input: {
    type: DayEventType;
    placeId?: number | null;
    transportType?: TransportType | null;
    time?: string | null;
    note?: string | null;
  },
) {
  const access = await requireTripAccess(tripId);
  await db
    .update(dayEvent)
    .set({
      type: input.type,
      placeId: input.placeId ?? null,
      transportType: input.type === "transport" ? input.transportType ?? null : null,
      time: input.time || null,
      note: input.note || null,
      ...touch(),
    })
    .where(eq(dayEvent.id, eventId));
  revalidatePath(`/trip/${access.trip.id}/days`);
}

export async function deleteEvent(tripId: number, eventId: number) {
  const access = await requireTripAccess(tripId);
  await db
    .update(dayEvent)
    .set({ deletedAt: new Date(), ...touch() })
    .where(eq(dayEvent.id, eventId));
  revalidatePath(`/trip/${access.trip.id}/days`);
}

/** Swaps `orderIndex` with the adjacent event in the given direction. */
export async function moveEvent(
  tripId: number,
  dayId: number,
  eventId: number,
  direction: "up" | "down",
) {
  const access = await requireTripAccess(tripId);

  const events = await db
    .select({ id: dayEvent.id, orderIndex: dayEvent.orderIndex })
    .from(dayEvent)
    .where(and(eq(dayEvent.dayId, dayId), isNull(dayEvent.deletedAt)))
    .orderBy(dayEvent.orderIndex)
    .all();

  const idx = events.findIndex((e) => e.id === eventId);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx === -1 || swapIdx < 0 || swapIdx >= events.length) return;

  const a = events[idx];
  const b = events[swapIdx];

  await db.update(dayEvent).set({ orderIndex: b.orderIndex, ...touch() }).where(eq(dayEvent.id, a.id));
  await db.update(dayEvent).set({ orderIndex: a.orderIndex, ...touch() }).where(eq(dayEvent.id, b.id));

  revalidatePath(`/trip/${access.trip.id}/days`);
}
