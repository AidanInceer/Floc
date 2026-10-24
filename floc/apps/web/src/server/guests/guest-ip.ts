/**
 * New guests per IP address (#442, ADR-029). Counted after the guest is made,
 * from the address Better Auth itself stamped on the session, so the limit and
 * the session never disagree about who the caller is.
 */
import "server-only";

import { and, count, eq, gt } from "drizzle-orm";

import { db } from "@/db";
import { session, user } from "@/db/schema";
import { GUEST_IP_LIMIT, GUEST_IP_WINDOW_MS } from "@floc/core/people/guests";

export async function guestsFromIpOverLimit(ip: string, now = new Date()): Promise<boolean> {
  const since = new Date(now.getTime() - GUEST_IP_WINDOW_MS);
  const row = await db
    .select({ n: count() })
    .from(session)
    .innerJoin(user, eq(user.id, session.userId))
    .where(and(eq(session.ipAddress, ip), gt(session.createdAt, since), eq(user.isAnonymous, true)))
    .get();
  return (row?.n ?? 0) > GUEST_IP_LIMIT;
}
