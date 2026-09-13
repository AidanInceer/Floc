/**
 * Email for whoever push cannot reach (#346): no phone, or push switched off.
 * The reach rule is the exact opposite of push's, so one notification is never
 * both pushed and emailed.
 */
import "server-only";

import { and, inArray, not, or } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema";
import { notificationText } from "@floc/core/notifications/notification-text";
import { EMAIL_LIMITS, EMAIL_WAIT_MS, type PlannedPush } from "@floc/core/notifications/push-plan";
import { absoluteUrl, type OutboundEmail } from "@/server/auth/email";
import { claim, hasPhone, markSent, planDue, release, switchedOff, type Channel } from "@/server/notifications/outbox";

export type EmailSender = (emails: OutboundEmail[]) => Promise<void>;

const EMAIL: Channel = {
  claimKey: "emailClaimedAt",
  sentKey: "emailedAt",
  waitMs: EMAIL_WAIT_MS,
  limits: EMAIL_LIMITS,
  reaches: () => and(not(switchedOff("notifyEmail")), or(switchedOff("notifyPush"), not(hasPhone()))),
  words: (kind, parts) => notificationText(kind, parts),
};

function emailFor(to: string, planned: PlannedPush, lines: string[]): OutboundEmail {
  return {
    to,
    subject: lines.length === 1 ? lines[0] : `${lines.length} new things on ${planned.title}`,
    lines,
    cta: { label: "Open in Floc", url: absoluteUrl(planned.href) },
  };
}

export async function sendDueEmails(send: EmailSender, now = new Date()): Promise<number> {
  const plan = await planDue(EMAIL, now);
  if (plan.length === 0) return 0;

  const addresses = new Map(
    (
      await db
        .select({ id: user.id, email: user.email })
        .from(user)
        .where(inArray(user.id, [...new Set(plan.map((p) => p.userId))]))
        .all()
    ).map((u) => [u.id, u.email]),
  );

  const claimed: number[] = [];
  const emails: OutboundEmail[] = [];
  for (const planned of plan) {
    const to = addresses.get(planned.userId);
    if (!to) continue;
    const ids = await claim(EMAIL, planned.notificationIds, now);
    if (ids.length === 0) continue;
    claimed.push(...ids);
    emails.push(emailFor(to, planned, planned.lines.filter((_, i) => ids.includes(planned.notificationIds[i]))));
  }
  if (emails.length === 0) return 0;

  try {
    await send(emails);
  } catch (error) {
    await release(EMAIL, claimed);
    throw error;
  }
  await markSent(EMAIL, claimed, now);
  return emails.length;
}
