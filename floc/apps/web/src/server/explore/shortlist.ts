import "server-only";

import { SHORTLIST_CAP } from "@floc/core/trip/explore/explore-match";
import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import { and, asc, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { exploreSave } from "@/db/schema";

export type SaveResult = "ok" | "full" | "unknown";

export async function listSaved(userId: string): Promise<string[]> {
  const rows = await db
    .select({ presetId: exploreSave.presetId })
    .from(exploreSave)
    .where(and(eq(exploreSave.userId, userId), isNull(exploreSave.deletedAt)))
    .orderBy(asc(exploreSave.lastModifiedAt))
    .all();
  return rows.map((r) => r.presetId);
}

export async function setSaved(
  userId: string,
  presetId: string,
  saved: boolean,
): Promise<SaveResult> {
  if (!PRESET_TRIPS.some((t) => t.id === presetId)) return "unknown";
  const now = new Date();

  if (!saved) {
    await db
      .update(exploreSave)
      .set({ deletedAt: now, lastModifiedAt: now })
      .where(
        and(
          eq(exploreSave.userId, userId),
          eq(exploreSave.presetId, presetId),
          isNull(exploreSave.deletedAt),
        ),
      );
    return "ok";
  }

  const current = await listSaved(userId);
  if (current.includes(presetId)) return "ok";
  if (current.length >= SHORTLIST_CAP) return "full";

  await db
    .insert(exploreSave)
    .values({ userId, presetId })
    .onConflictDoUpdate({
      target: [exploreSave.userId, exploreSave.presetId],
      set: { deletedAt: null, lastModifiedAt: now },
    });
  return "ok";
}
