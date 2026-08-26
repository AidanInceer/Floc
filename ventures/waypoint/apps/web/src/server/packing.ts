/**
 * The packing aggregate — `packing_line` and `packing_claim` (ticket 219).
 * Owns the SQL, soft-delete (rule 8) and the tab's revalidate. Claims are read
 * for the whole trip in one query, scoped by joining the line, so the two reads
 * can run together rather than one after the other.
 */
import "server-only";

import { and, asc, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { packingClaim, packingLine, user, userProfile } from "@/db/schema";
import { bounded, LIMITS } from "@/server/limits";
import { touch } from "@/server/audit";

export function revalidatePacking(tripId: number): void {
  revalidatePath(`/trip/${tripId}/packing`);
}

export type PackingLine = {
  id: number;
  label: string;
  createdAt: Date;
};

export type PackingClaimRow = {
  packingLineId: number;
  userId: string;
  packedAt: Date | null;
  name: string;
  avatarUrl: string | null;
};

/** The shared list, oldest first — a packing list is a checklist, not a feed. */
export async function listPackingLines(
  tripId: number,
): Promise<PackingLine[]> {
  const rows = await db
    .select({
      id: packingLine.id,
      label: packingLine.label,
      createdAt: packingLine.createdAt,
    })
    .from(packingLine)
    .where(and(eq(packingLine.tripId, tripId), isNull(packingLine.deletedAt)))
    .orderBy(asc(packingLine.createdAt), asc(packingLine.id))
    .limit(LIMITS.packingLines)
    .all();
  return bounded(rows, "packingLines", `trip ${tripId}`);
}

/** Name and avatar ride along: a claimer may since have left the trip, so the roster can't fill them in. */
export async function listPackingClaims(
  tripId: number,
): Promise<PackingClaimRow[]> {
  return db
    .select({
      packingLineId: packingClaim.packingLineId,
      userId: packingClaim.userId,
      packedAt: packingClaim.packedAt,
      name: user.name,
      avatarUrl: userProfile.avatarUrl,
    })
    .from(packingClaim)
    .innerJoin(packingLine, eq(packingLine.id, packingClaim.packingLineId))
    .innerJoin(user, eq(user.id, packingClaim.userId))
    .leftJoin(userProfile, eq(userProfile.userId, packingClaim.userId))
    .where(
      and(
        eq(packingLine.tripId, tripId),
        isNull(packingLine.deletedAt),
        isNull(packingClaim.deletedAt),
      ),
    )
    .limit(LIMITS.packingLines * LIMITS.members)
    .all();
}

export async function insertPackingLine(
  tripId: number,
  createdBy: string,
  label: string,
): Promise<void> {
  await db.insert(packingLine).values({ tripId, createdBy, label });
}

export async function softDeletePackingLine(lineId: number): Promise<void> {
  await db
    .update(packingLine)
    .set({ deletedAt: new Date(), ...touch() })
    .where(and(eq(packingLine.id, lineId), isNull(packingLine.deletedAt)));
}

/**
 * Upsert on the (line, user) unique index. `deletedAt: null` is load-bearing:
 * the index doesn't know about soft-delete, so an unclaimed row blocks the
 * re-insert and, unreset, silently eats a re-claim. `packedAt` resets too — a
 * fresh claim starts unpacked whatever the last one ended as.
 */
export async function claimPackingLine(
  lineId: number,
  userId: string,
): Promise<void> {
  await db
    .insert(packingClaim)
    .values({ packingLineId: lineId, userId })
    .onConflictDoUpdate({
      target: [packingClaim.packingLineId, packingClaim.userId],
      set: { packedAt: null, deletedAt: null, ...touch() },
    });
}

export async function unclaimPackingLine(
  lineId: number,
  userId: string,
): Promise<void> {
  await db
    .update(packingClaim)
    .set({ deletedAt: new Date(), ...touch() })
    .where(
      and(
        eq(packingClaim.packingLineId, lineId),
        eq(packingClaim.userId, userId),
        isNull(packingClaim.deletedAt),
      ),
    );
}

/** Tick or untick your own claim. Writes nothing if the claim isn't yours or is gone. */
export async function setClaimPacked(
  lineId: number,
  userId: string,
  packed: boolean,
): Promise<void> {
  await db
    .update(packingClaim)
    .set({ packedAt: packed ? new Date() : null, ...touch() })
    .where(
      and(
        eq(packingClaim.packingLineId, lineId),
        eq(packingClaim.userId, userId),
        isNull(packingClaim.deletedAt),
      ),
    );
}
