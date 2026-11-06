import "server-only";

import { and, count, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { trip, tripMembership, userProfile } from "@/db/schema";
import { ensureProfile, getProfile } from "@/server/auth/profile";
import { shouldStartWalkthrough } from "@floc/core/trip/walkthrough";

export async function tourSeenAt(userId: string): Promise<Date | null> {
  return (await getProfile(userId))?.tourSeenAt ?? null;
}

/** Trips the person is on now, archived ones included: an archived trip still means they have used Floc. */
async function tripsOnCount(userId: string): Promise<number> {
  const row = await db
    .select({ n: count() })
    .from(tripMembership)
    .innerJoin(trip, eq(trip.id, tripMembership.tripId))
    .where(and(eq(tripMembership.userId, userId), isNull(tripMembership.deletedAt), isNull(trip.deletedAt)))
    .get();
  return row?.n ?? 0;
}

/** The first-trip walkthrough opens on a person's first trip, once (#314). */
export async function walkthroughDue(userId: string): Promise<boolean> {
  const [seen, tripCount] = await Promise.all([tourSeenAt(userId), tripsOnCount(userId)]);
  return shouldStartWalkthrough({ seen: seen !== null, tripCount });
}

/** The first finish or skip stands; a second call writes nothing (#314). */
export async function markTourSeen(userId: string): Promise<void> {
  await ensureProfile(userId);
  const now = new Date();
  await db
    .update(userProfile)
    .set({ tourSeenAt: now, lastModifiedAt: now })
    .where(and(eq(userProfile.userId, userId), isNull(userProfile.tourSeenAt)));
}
