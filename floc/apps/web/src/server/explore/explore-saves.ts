import "server-only";

import { and, desc, eq, isNull, sql } from "drizzle-orm";

import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";

import { db } from "@/db";
import { exploreSave } from "@/db/schema";
import { refresh } from "@/server/freshness";

const LISTED = new Set(PRESET_TRIPS.map((t) => t.id));

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

export async function setTripSaved(userId: string, presetId: string, saved: boolean): Promise<void> {
  if (LISTED.has(presetId)) {
    const now = new Date();
    await db
      .insert(exploreSave)
      .values({ userId, presetId, deletedAt: saved ? null : now })
      .onConflictDoUpdate({
        target: [exploreSave.userId, exploreSave.presetId],
        set: { deletedAt: saved ? null : now, lastModifiedAt: now },
      });
  }
  refresh({ kind: "savedTrips" });
}
