import "server-only";

import { desc, eq } from "drizzle-orm";

import { TERMS_VERSION } from "@floc/core/legal/terms";

import { db } from "@/db";
import { termsAcceptance } from "@/db/schema";

export async function recordTermsAcceptance(userId: string, version: string = TERMS_VERSION, at = new Date()): Promise<void> {
  await db.insert(termsAcceptance).values({ userId, version, acceptedAt: at }).onConflictDoNothing();
}

export async function acceptedTerms(userId: string): Promise<{ version: string; acceptedAt: Date }[]> {
  return db
    .select({ version: termsAcceptance.version, acceptedAt: termsAcceptance.acceptedAt })
    .from(termsAcceptance)
    .where(eq(termsAcceptance.userId, userId))
    .orderBy(desc(termsAcceptance.acceptedAt));
}
