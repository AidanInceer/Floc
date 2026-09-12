import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { userProfile } from "@/db/schema";
import { ensureProfile, getProfile } from "@/server/auth/profile";

export async function tourSeenAt(userId: string): Promise<Date | null> {
  return (await getProfile(userId))?.tourSeenAt ?? null;
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
