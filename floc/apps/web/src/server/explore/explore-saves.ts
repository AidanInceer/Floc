import "server-only";

import { and, desc, eq, isNull, sql } from "drizzle-orm";

import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";

import { db } from "@/db";
import { exploreSave } from "@/db/schema";

const LISTED = new Set(PRESET_TRIPS.map((t) => t.id));

/**
 * The Explore trips one person saved, newest first (#467). Who else may read them is the Saved
 * ring's call in `server/auth/visibility.ts` (ADR-045), never this function's.
 * Why: bounded by the listings themselves, since a save is only written for a listed trip.
 */
export async function savedTripIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ presetId: exploreSave.presetId })
    .from(exploreSave)
    .where(and(eq(exploreSave.userId, userId), isNull(exploreSave.deletedAt)))
    .orderBy(desc(exploreSave.lastModifiedAt), desc(sql`rowid`))
    .limit(PRESET_TRIPS.length)
    .all();
  return rows.map((r) => r.presetId).filter((id) => LISTED.has(id));
}

/** Saves or takes off one trip. Taking off soft-deletes (rule 8); saving again brings the row back. */
export async function setTripSaved(userId: string, presetId: string, saved: boolean): Promise<void> {
  if (!LISTED.has(presetId)) return;
  const now = new Date();
  await db
    .insert(exploreSave)
    .values({ userId, presetId, deletedAt: saved ? null : now })
    .onConflictDoUpdate({
      target: [exploreSave.userId, exploreSave.presetId],
      set: { deletedAt: saved ? null : now, lastModifiedAt: now },
    });
}
