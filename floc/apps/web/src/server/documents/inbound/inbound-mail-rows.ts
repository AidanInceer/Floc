/** The record of received mail (#559): one row a mail, so a webhook sent twice is processed once and a sender has a limit. */
import "server-only";

import { and, count, eq, gt } from "drizzle-orm";

import { INBOUND_MAILS_PER_HOUR } from "@floc/core/documents/booking/booking-inbox";

import { db } from "@/db";
import { inboundMail } from "@/db/schema";

const HOUR_MS = 60 * 60 * 1000;

/**
 * True when this delivery is the first for the mail. A replay answers false and is dropped.
 * Why no sender on the row yet: the From is not proven here, and an unproven mail must not count against a member.
 */
export async function claimInboundMail(emailId: string): Promise<boolean> {
  const rows = await db
    .insert(inboundMail)
    .values({ emailId })
    .onConflictDoNothing()
    .returning({ emailId: inboundMail.emailId })
    .all();
  return rows.length === 1;
}

/** Gives the claim back, so the mail can be delivered again after a failure. */
export async function releaseInboundMail(emailId: string): Promise<void> {
  await db.delete(inboundMail).where(eq(inboundMail.emailId, emailId)).run();
}

/** Puts a proven mail under its sender, then says whether it is the mail past the hour's limit. */
export async function overInboundLimit(emailId: string, userId: string, now = new Date()): Promise<boolean> {
  await db.update(inboundMail).set({ userId }).where(eq(inboundMail.emailId, emailId)).run();
  const row = await db
    .select({ n: count() })
    .from(inboundMail)
    .where(and(eq(inboundMail.userId, userId), gt(inboundMail.createdAt, new Date(now.getTime() - HOUR_MS))))
    .get();
  return (row?.n ?? 0) > INBOUND_MAILS_PER_HOUR;
}
