/**
 * The write side of the sticky per-tab unlocks — the only persisted lifecycle
 * state in v1 (ticket 04). Trip state is otherwise derived from what data
 * exists.
 *
 * The rule the schema cannot enforce: an unlock never regresses. Deleting the
 * last idea must not re-lock Route. So we only ever stamp a flag, never clear
 * one.
 *
 * Server-only: it touches the database. The tab shapes the client tab bar
 * needs live in `lib/tabs.ts`, which is import-safe from the browser — import
 * them from there. This module used to re-export them, which added nothing and
 * meant two import paths for one thing (ticket 117, S9).
 */
import "server-only";

import { and, eq, isNull, sql } from "drizzle-orm";

import { db } from "@/db";
import { day, idea, trip } from "@/db/schema";
import type { Trip } from "@/db/schema";

/**
 * Called after any write that could unlock a tab. Idempotent, and one-way:
 * `route_unlocked_at`/`days_unlocked_at` are set only if currently null.
 */
export async function refreshUnlocks(tripId: number): Promise<void> {
  const hasIdea = await db
    .select({ id: idea.id })
    .from(idea)
    .where(and(eq(idea.tripId, tripId), isNull(idea.deletedAt)))
    .get();

  const hasDay = await db
    .select({ id: day.id })
    .from(day)
    .where(and(eq(day.tripId, tripId), isNull(day.deletedAt)))
    .get();

  const patch: Partial<Trip> = {};
  if (hasIdea) patch.routeUnlockedAt = new Date();
  if (hasDay) patch.daysUnlockedAt = new Date();
  if (Object.keys(patch).length === 0) return;

  await db
    .update(trip)
    .set({
      // COALESCE keeps the original timestamp — an unlock is never re-stamped
      // and never cleared.
      routeUnlockedAt: patch.routeUnlockedAt
        ? sql`coalesce(${trip.routeUnlockedAt}, ${Math.floor(patch.routeUnlockedAt.getTime() / 1000)})`
        : trip.routeUnlockedAt,
      daysUnlockedAt: patch.daysUnlockedAt
        ? sql`coalesce(${trip.daysUnlockedAt}, ${Math.floor(patch.daysUnlockedAt.getTime() / 1000)})`
        : trip.daysUnlockedAt,
    })
    .where(eq(trip.id, tripId));
}

/** Bumped by every write path so `last_modified_at` stays useful for debugging. */
export function touch() {
  return { lastModifiedAt: new Date() };
}
