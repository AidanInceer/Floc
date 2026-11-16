import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema";

export async function userIdForEmail(email: string): Promise<string | null> {
  const row = await db
    .select({ id: user.id })
    .from(user)
    .where(and(eq(sql`lower(${user.email})`, email.trim().toLowerCase()), eq(user.emailVerified, true)))
    .get();
  return row?.id ?? null;
}
