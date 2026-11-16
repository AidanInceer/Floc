import "server-only";

import { and, eq, exists, gte, inArray, isNotNull, isNull, lt, lte, notInArray, or, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";

import { db } from "@/db";
import { activity, notification, pushToken, tripMembership, user, userProfile } from "@/db/schema";
import { planPushes, type Limits, type PendingPush, type PlannedPush } from "@floc/core/notifications/push-plan";
import { REMINDER_KINDS, isReminder, type ActivityKind } from "@floc/core/notifications/rules";
import { touch } from "@/server/audit";
import { notificationRows, stillVisible } from "@/server/notifications/visible";

const CLAIM_LEASE_MS = 5 * 60_000;
const BATCH = 500;

export type Channel = {
  claimKey: "pushClaimedAt" | "emailClaimedAt";
  sentKey: "pushedAt" | "emailedAt";
  waitMs: number;
  limits: Limits;
  reaches: () => SQL | undefined;
  words: (kind: ActivityKind, parts: { actor: string; trip: string | null; detail: string | null }) => string;
};

const recipientProfile = alias(userProfile, "recipient_profile");

export const switchedOff = (key: "notifyPush" | "notifyEmail") =>
  exists(
    db
      .select({ userId: recipientProfile.userId })
      .from(recipientProfile)
      .where(and(eq(recipientProfile.userId, notification.userId), eq(recipientProfile[key], false))),
  );

const recipient = alias(user, "recipient");

export const addressConfirmed = () =>
  exists(
    db
      .select({ id: recipient.id })
      .from(recipient)
      .where(and(eq(recipient.id, notification.userId), eq(recipient.emailVerified, true))),
  );

export const hasPhone = () =>
  exists(
    db
      .select({ id: pushToken.id })
      .from(pushToken)
      .where(
        and(
          eq(pushToken.userId, notification.userId),
          isNull(pushToken.deletedAt),
          lte(pushToken.registeredAt, activity.createdAt),
        ),
      ),
  );

const unclaimed = (channel: Channel, now: Date) =>
  or(
    isNull(notification[channel.claimKey]),
    lt(notification[channel.claimKey], new Date(now.getTime() - CLAIM_LEASE_MS)),
  );

async function due(channel: Channel, now: Date): Promise<PendingPush[]> {
  const rows = await notificationRows(
    and(
      eq(notification.loud, true),
      isNull(notification.readAt),
      isNull(notification[channel.sentKey]),
      unclaimed(channel, now),
      lte(activity.lastModifiedAt, new Date(now.getTime() - channel.waitMs)),
      stillVisible(),
      isNull(tripMembership.mutedAt),
      channel.reaches(),
    ),
    BATCH,
  );
  return rows.map((r) => ({
    notificationId: r.id,
    userId: r.userId,
    tripId: r.tripId,
    tripName: r.tripName,
    text: channel.words(r.kind, { actor: r.actorDisplayName ?? r.actorName, trip: r.tripName, detail: r.detail }),
    href: r.href,
    ...(isReminder(r.kind) ? { exempt: true } : {}),
  }));
}

async function sentToday(channel: Channel, now: Date) {
  const sent = notification[channel.sentKey];
  const rows = await db
    .selectDistinct({ userId: notification.userId, tripId: activity.tripId, sentAt: sent })
    .from(notification)
    .innerJoin(activity, eq(activity.id, notification.activityId))
    .where(
      and(isNotNull(sent), gte(sent, new Date(now.getTime() - 86_400_000)), notInArray(activity.kind, REMINDER_KINDS)),
    )
    .all();
  return rows.map((r) => ({ userId: r.userId, tripId: r.tripId, sentAt: r.sentAt! }));
}

export async function planDue(channel: Channel, now: Date): Promise<PlannedPush[]> {
  return planPushes(await due(channel, now), await sentToday(channel, now), now, channel.limits);
}

export async function claim(channel: Channel, ids: number[], now: Date): Promise<number[]> {
  const won = await db
    .update(notification)
    .set({ [channel.claimKey]: now })
    .where(and(inArray(notification.id, ids), isNull(notification[channel.sentKey]), unclaimed(channel, now)))
    .returning({ id: notification.id })
    .all();
  return won.map((w) => w.id);
}

export async function release(channel: Channel, ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  await db.update(notification).set({ [channel.claimKey]: null }).where(inArray(notification.id, ids));
}

export async function markSent(channel: Channel, ids: number[], now: Date): Promise<void> {
  if (ids.length === 0) return;
  await db
    .update(notification)
    .set({ [channel.sentKey]: now, ...touch() })
    .where(inArray(notification.id, ids));
}
