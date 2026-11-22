import type { AvatarIcon } from "@floc/core/people/avatar-icon";
import "server-only";

import { and, asc, eq, inArray, isNotNull, isNull, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { packingClaim, packingLine, tripMembership, user, userProfile } from "@/db/schema";
import { MAX_PACK_QUANTITY, MIN_PACK_QUANTITY } from "@floc/core/packing/packing";
import type { PackCategory, PackOrigin, PackTier } from "@floc/core/packing/packing";
import { assertRoom, bounded, LIMITS } from "@/server/limits";
import { tripHref } from "@floc/core/notifications/notification-href";
import { touch } from "@/server/audit";
import { recordActivity } from "@/server/notifications/activity";
import { liveMembership } from "@/server/trips/roster";

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
  avatarIcon: AvatarIcon | null;
};

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
  kitName: string | null;
  origin: PackOrigin | null;
};

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
      origin: packingLine.origin,
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

export async function listPackingClaims(
  tripId: number,
): Promise<PackingClaimRow[]> {
  return db
    .select({
      packingLineId: packingClaim.packingLineId,
      userId: packingClaim.userId,
      packedAt: packingClaim.packedAt,
      name: user.name,
      avatarIcon: userProfile.avatarIcon,
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

export async function viewerHasPacking(tripId: number, userId: string): Promise<boolean> {
  const own = await db
    .select({ id: packingLine.id })
    .from(packingLine)
    .where(and(eq(packingLine.tripId, tripId), eq(packingLine.ownerId, userId), isNull(packingLine.deletedAt)))
    .limit(1)
    .get();
  if (own) return true;
  const claimed = await db
    .select({ id: packingClaim.packingLineId })
    .from(packingClaim)
    .innerJoin(packingLine, eq(packingLine.id, packingClaim.packingLineId))
    .where(
      and(
        eq(packingLine.tripId, tripId),
        eq(packingClaim.userId, userId),
        isNull(packingLine.deletedAt),
        isNull(packingClaim.deletedAt),
      ),
    )
    .limit(1)
    .get();
  return claimed !== undefined;
}

async function countLines(tripId: number, ownerId: string | null): Promise<number> {
  const owner = ownerId === null ? isNull(packingLine.ownerId) : eq(packingLine.ownerId, ownerId);
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)` })
    .from(packingLine)
    .where(and(eq(packingLine.tripId, tripId), owner, isNull(packingLine.deletedAt)));
  return n;
}

export async function insertPackingLine(
  tripId: number,
  createdBy: string,
  label: string,
  category: PackCategory,
): Promise<void> {
  assertRoom("packingLines", await countLines(tripId, null));
  await db.insert(packingLine).values({ tripId, createdBy, label, category });
}

export async function renamePackingLineLabel(lineId: number, label: string): Promise<void> {
  await db
    .update(packingLine)
    .set({ label, ...touch() })
    .where(and(eq(packingLine.id, lineId), isNull(packingLine.deletedAt)));
}

export async function insertPersonalPackingLine(
  tripId: number,
  ownerId: string,
  label: string,
  category: PackCategory,
): Promise<void> {
  assertRoom("packingLines", await countLines(tripId, ownerId));
  await db
    .insert(packingLine)
    .values({ tripId, createdBy: ownerId, ownerId, label, category });
}

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

export async function softDeleteWholeList(
  tripId: number,
  ownerId: string | null,
  by: string,
): Promise<void> {
  await dropLines(
    by,
    and(
      eq(packingLine.tripId, tripId),
      ownerId === null
        ? isNull(packingLine.ownerId)
        : eq(packingLine.ownerId, ownerId),
      isNull(packingLine.deletedAt),
    ),
  );
}

export async function softDeletePackingLines(lineIds: number[], by: string): Promise<void> {
  if (lineIds.length === 0) return;
  await dropLines(by, and(inArray(packingLine.id, lineIds), isNull(packingLine.deletedAt)));
}

export async function softDeleteSuggestedLines(tripId: number, ownerId: string): Promise<number> {
  return dropLines(
    ownerId,
    and(
      eq(packingLine.tripId, tripId),
      eq(packingLine.ownerId, ownerId),
      eq(packingLine.origin, "suggested"),
      isNull(packingLine.packedAt),
      isNull(packingLine.deletedAt),
    ),
  );
}

export async function softDeleteUnpackedLines(tripId: number, ownerId: string): Promise<number> {
  return dropLines(
    ownerId,
    and(
      eq(packingLine.tripId, tripId),
      eq(packingLine.ownerId, ownerId),
      isNull(packingLine.packedAt),
      isNull(packingLine.deletedAt),
    ),
  );
}

export async function unpackPersonalLines(tripId: number, ownerId: string): Promise<void> {
  await db
    .update(packingLine)
    .set({ packedAt: null, ...touch() })
    .where(
      and(
        eq(packingLine.tripId, tripId),
        eq(packingLine.ownerId, ownerId),
        isNotNull(packingLine.packedAt),
        isNull(packingLine.deletedAt),
      ),
    );
}

export async function softDeletePackingLine(lineId: number, by: string): Promise<void> {
  await dropLines(by, and(eq(packingLine.id, lineId), isNull(packingLine.deletedAt)));
}

async function dropLines(by: string, which: SQL | undefined): Promise<number> {
  return db.transaction(async (tx) => {
    const lines = await tx
      .update(packingLine)
      .set({ deletedAt: new Date(), ...touch() })
      .where(which)
      .returning({ id: packingLine.id, tripId: packingLine.tripId })
      .all();
    if (lines.length === 0) return 0;

    const claims = await tx
      .select({ userId: packingClaim.userId })
      .from(packingClaim)
      .where(
        and(
          inArray(packingClaim.packingLineId, lines.map((l) => l.id)),
          isNull(packingClaim.deletedAt),
        ),
      )
      .all();
    const affected = claims.map((c) => c.userId).filter((userId) => userId !== by);
    if (affected.length === 0) return lines.length;

    await recordActivity(tx, {
      kind: "packing_claim_changed",
      tripId: lines[0].tripId,
      actorId: by,
      subjectId: null,
      href: tripHref(lines[0].tripId, "packing"),
      affected,
    });
    return lines.length;
  });
}

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

export async function getPackSettings(
  tripId: number,
  userId: string,
): Promise<{ tier: PackTier | null; ideasShownAt: Date | null }> {
  const row = await db
    .select({
      packTier: tripMembership.packTier,
      packIdeasShownAt: tripMembership.packIdeasShownAt,
    })
    .from(tripMembership)
    .where(liveMembership(tripId, userId))
    .get();
  return { tier: row?.packTier ?? null, ideasShownAt: row?.packIdeasShownAt ?? null };
}

export async function setPackIdeasShown(
  tripId: number,
  userId: string,
  shown: boolean,
): Promise<void> {
  await db
    .update(tripMembership)
    .set({ packIdeasShownAt: shown ? new Date() : null, ...touch() })
    .where(liveMembership(tripId, userId));
}

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
