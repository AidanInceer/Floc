import "server-only";

import { and, count, eq, gt } from "drizzle-orm";

import { INBOUND_MAILS_PER_HOUR } from "@floc/core/documents/booking/booking-inbox";

import { db } from "@/db";
import { inboundMail } from "@/db/schema";

const HOUR_MS = 60 * 60 * 1000;

export async function claimInboundMail(emailId: string): Promise<boolean> {
  const rows = await db
    .insert(inboundMail)
    .values({ emailId })
    .onConflictDoNothing()
    .returning({ emailId: inboundMail.emailId })
    .all();
  return rows.length === 1;
}

export async function releaseInboundMail(emailId: string): Promise<void> {
  await db.delete(inboundMail).where(eq(inboundMail.emailId, emailId)).run();
}

export async function overInboundLimit(emailId: string, userId: string, now = new Date()): Promise<boolean> {
  await db.update(inboundMail).set({ userId }).where(eq(inboundMail.emailId, emailId)).run();
  const row = await db
    .select({ n: count() })
    .from(inboundMail)
    .where(and(eq(inboundMail.userId, userId), gt(inboundMail.createdAt, new Date(now.getTime() - HOUR_MS))))
    .get();
  return (row?.n ?? 0) > INBOUND_MAILS_PER_HOUR;
}
