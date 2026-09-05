/**
 * The packing aggregate — `packing_line`, `packing_claim`, and your per-trip
 * packing settings off the membership row (ticket 219, ticket 242).
 * Owns the SQL and soft-delete (rule 8). Claims are read
 * for the whole trip in one query, scoped by joining the line, so the two reads
 * can run together rather than one after the other.
 */
import "server-only";

import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";

import { db } from "@/db";
import { packingClaim, packingLine, tripMembership, user, userProfile } from "@/db/schema";
import { MAX_PACK_QUANTITY, MIN_PACK_QUANTITY } from "@floc/core/packing";
import type { PackCategory, PackTier } from "@floc/core/packing";
import { bounded, LIMITS } from "@/server/limits";
import { touch } from "@/server/audit";
import { liveMembership } from "@/server/roster";

export type PackingLine = {
  id: number;
  label: string;
  category: PackCategory;
  createdAt: Date;
};

export type PackingClaimRow = {
  packingLineId: number;
  userId: string;
  packedAt: Date | null;
  name: string;
  avatarUrl: string | null;
};

/**
 * The shared list, oldest first — a packing list is a checklist, not a feed.
 * `owner_id is null` is what makes it shared: personal lines live in the same
 * table and must never leak into the group's view (ticket 220).
 */
export async function listPackingLines(
  tripId: number,
): Promise<PackingLine[]> {
  const rows = await db
    .select({
      id: packingLine.id,
      label: packingLine.label,
      category: packingLine.category,
      createdAt: packingLine.createdAt,
    })
    .from(packingLine)
    .where(
      and(
        eq(packingLine.tripId, tripId),
        isNull(packingLine.ownerId),
        isNull(packingLine.deletedAt),
      ),
    )
    .orderBy(asc(packingLine.createdAt), asc(packingLine.id))
    .limit(LIMITS.packingLines)
    .all();
  return bounded(rows, "packingLines", `trip ${tripId}`);
}

export type PersonalPackingLine = PackingLine & {
  packedAt: Date | null;
  quantity: number;
  /** The saved list it came from, if any (ticket 230) — it heads its own group. */
  kitName: string | null;
};

/**
 * One person's own bag on one trip. Scoped by owner in the query rather than
 * filtered after, so reading somebody else's list isn't expressible here
 * (ticket 220).
 */
export async function listPersonalPackingLines(
  tripId: number,
  ownerId: string,
): Promise<PersonalPackingLine[]> {
  const rows = await db
    .select({
      id: packingLine.id,
      label: packingLine.label,
      category: packingLine.category,
      createdAt: packingLine.createdAt,
      packedAt: packingLine.packedAt,
      quantity: packingLine.quantity,
      kitName: packingLine.kitName,
    })
    .from(packingLine)
    .where(
      and(
        eq(packingLine.tripId, tripId),
        eq(packingLine.ownerId, ownerId),
        isNull(packingLine.deletedAt),
      ),
    )
    .orderBy(asc(packingLine.createdAt), asc(packingLine.id))
    .limit(LIMITS.packingLines)
    .all();
  return bounded(rows, "packingLines", `trip ${tripId} personal`);
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
  category: PackCategory,
): Promise<void> {
  await db.insert(packingLine).values({ tripId, createdBy, label, category });
}

/** The same table, with an owner — author and owner are the same person by construction. */
export async function insertPersonalPackingLine(
  tripId: number,
  ownerId: string,
  label: string,
  category: PackCategory,
): Promise<void> {
  await db
    .insert(packingLine)
    .values({ tripId, createdBy: ownerId, ownerId, label, category });
}

/**
 * Nudge a line's count by one. The arithmetic and the clamp happen in SQL
 * rather than read-modify-write in the action: two quick clicks are one plus
 * each, and a round trip through JS would let the slower one overwrite the
 * faster with a stale number.
 */
export async function stepPersonalQuantity(
  lineId: number,
  ownerId: string,
  delta: 1 | -1,
): Promise<void> {
  await db
    .update(packingLine)
    .set({
      quantity: sql`max(${MIN_PACK_QUANTITY}, min(${MAX_PACK_QUANTITY}, ${packingLine.quantity} + ${delta}))`,
      ...touch(),
    })
    .where(
      and(
        eq(packingLine.id, lineId),
        eq(packingLine.ownerId, ownerId),
        isNull(packingLine.deletedAt),
      ),
    );
}

/**
 * Tick or untick a line on your own bag. Scoped to (line, owner) so ticking
 * somebody else's is not expressible, and — because a shared line's owner is
 * null — so is a shared line picking up a personal tick nothing would read.
 */
export async function setPersonalPacked(
  lineId: number,
  ownerId: string,
  packed: boolean,
): Promise<void> {
  await db
    .update(packingLine)
    .set({ packedAt: packed ? new Date() : null, ...touch() })
    .where(
      and(
        eq(packingLine.id, lineId),
        eq(packingLine.ownerId, ownerId),
        isNull(packingLine.deletedAt),
      ),
    );
}

/**
 * Clear a whole list at once (ticket 229) — the shared one when `ownerId` is
 * null, one person's bag when it isn't. Scoped by owner in the statement rather
 * than by resolving ids first: "wipe my bag" must not be expressible as "wipe
 * someone else's", whatever ids reach it.
 */
export async function softDeleteWholeList(
  tripId: number,
  ownerId: string | null,
): Promise<void> {
  await db
    .update(packingLine)
    .set({ deletedAt: new Date(), ...touch() })
    .where(
      and(
        eq(packingLine.tripId, tripId),
        ownerId === null
          ? isNull(packingLine.ownerId)
          : eq(packingLine.ownerId, ownerId),
        isNull(packingLine.deletedAt),
      ),
    );
}

/** Several at once, from a tick-and-remove (ticket 229). The caller has already resolved every id through `access.packingLine`. */
export async function softDeletePackingLines(lineIds: number[]): Promise<void> {
  if (lineIds.length === 0) return;
  await db
    .update(packingLine)
    .set({ deletedAt: new Date(), ...touch() })
    .where(and(inArray(packingLine.id, lineIds), isNull(packingLine.deletedAt)));
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

/* --------------------------------------- your packing settings on this trip */
/*
 * Both live on the `trip_membership` row because they are facts about *you on
 * this trip*, not about the trip (ticket 220) — but they are packing's rules,
 * not the roster's, so they read that row from here (ticket 242).
 */

/** Both in one read: the page asks for both, and asking twice is a second round trip to Turso for a row already in hand. */
export async function getPackSettings(
  tripId: number,
  userId: string,
): Promise<{ tier: PackTier | null; generatedAt: Date | null }> {
  const row = await db
    .select({
      packTier: tripMembership.packTier,
      packGeneratedAt: tripMembership.packGeneratedAt,
    })
    .from(tripMembership)
    .where(liveMembership(tripId, userId))
    .get();
  return { tier: row?.packTier ?? null, generatedAt: row?.packGeneratedAt ?? null };
}

/** Null means you have never chosen here, and the profile default applies. */
export async function getPackTier(
  tripId: number,
  userId: string,
): Promise<PackTier | null> {
  return (await getPackSettings(tripId, userId)).tier;
}

export async function setPackTier(
  tripId: number,
  userId: string,
  tier: PackTier,
): Promise<void> {
  await db
    .update(tripMembership)
    .set({ packTier: tier, ...touch() })
    .where(liveMembership(tripId, userId));
}
