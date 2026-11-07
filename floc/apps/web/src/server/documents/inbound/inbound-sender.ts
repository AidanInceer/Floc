import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema";

/**
 * The account a mail's From names, matched without case — mail clients rewrite it freely. Only a confirmed
 * address counts: sign-up does not wait for confirmation (#149), so anyone can hold an account under another's address.
 */
export async function userIdForEmail(email: string): Promise<string | null> {
  const row = await db
    .select({ id: user.id })
    .from(user)
    .where(and(eq(sql`lower(${user.email})`, email.trim().toLowerCase()), eq(user.emailVerified, true)))
    .get();
  return row?.id ?? null;
}
