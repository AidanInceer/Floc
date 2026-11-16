import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { userProfile } from "@/db/schema";

export async function setMarketingEmailConsent(userId: string, on: boolean, now: Date): Promise<void> {
  if (!on) {
    await db.update(userProfile).set({ marketingEmailConsentAt: null, lastModifiedAt: now }).where(eq(userProfile.userId, userId));
    return;
  }
  await db
    .update(userProfile)
    .set({ marketingEmailConsentAt: now, lastModifiedAt: now })
    .where(and(eq(userProfile.userId, userId), isNull(userProfile.marketingEmailConsentAt)));
}
