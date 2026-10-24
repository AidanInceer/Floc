import "server-only";

import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema";

/** The account a mail's From names, matched without case — mail clients rewrite it freely. */
export async function userIdForEmail(email: string): Promise<string | null> {
  const row = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(sql`lower(${user.email})`, email.trim().toLowerCase()))
    .get();
  return row?.id ?? null;
}
