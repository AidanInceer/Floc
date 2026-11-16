/**
 * Email for whoever push cannot reach (#346): no phone, or push switched off.
 * The reach rule is the exact opposite of push's, so one notification is never
 * both pushed and emailed — and only to an address its owner has confirmed.
 */
import "server-only";

import { and, inArray, not, or } from "drizzle-orm";

import { db } from "@/db";
import { trip, user } from "@/db/schema";
import { notificationText } from "@floc/core/notifications/notification-text";
import { EMAIL_LIMITS, EMAIL_WAIT_MS, type PlannedPush } from "@floc/core/notifications/push-plan";
import type { OutboundEmail } from "@/server/auth/email";
import { noticeEmail, type NoticeTrip } from "@/server/notifications/notice-email";
import { addressConfirmed, claim, hasPhone, markSent, planDue, release, switchedOff, type Channel } from "@/server/notifications/outbox";

export type EmailSender = (emails: OutboundEmail[]) => Promise<unknown>;

const EMAIL: Channel = {
  claimKey: "emailClaimedAt",
  sentKey: "emailedAt",
  waitMs: EMAIL_WAIT_MS,
  limits: EMAIL_LIMITS,
  reaches: () =>
    and(addressConfirmed(), not(switchedOff("notifyEmail")), or(switchedOff("notifyPush"), not(hasPhone()))),
  words: (kind, parts) => notificationText(kind, parts),
};

async function tripsFor(plan: PlannedPush[]): Promise<Map<number, NoticeTrip>> {
  const ids = [...new Set(plan.flatMap((p) => (p.tripId === null ? [] : [p.tripId])))];
  if (ids.length === 0) return new Map();
  const rows = await db
    .select({ id: trip.id, name: trip.name, startDate: trip.startDate, endDate: trip.endDate, colorKey: trip.colorKey })
    .from(trip)
    .where(inArray(trip.id, ids))
    .all();
  return new Map(rows.map((r) => [r.id, r]));
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

  const trips = await tripsFor(plan);
  const claimed: number[] = [];
  const emails: OutboundEmail[] = [];
  for (const planned of plan) {
    const to = addresses.get(planned.userId);
    if (!to) continue;
    const ids = await claim(EMAIL, planned.notificationIds, now);
    if (ids.length === 0) continue;
    claimed.push(...ids);
    const kept = planned.notificationIds.map((id) => ids.includes(id));
    emails.push(
      noticeEmail({
        to,
        title: planned.title,
        href: planned.href,
        lines: planned.lines.filter((_, i) => kept[i]),
        parts: planned.parts.filter((_, i) => kept[i]),
        trip: planned.tripId === null ? null : (trips.get(planned.tripId) ?? null),
      }),
    );
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
