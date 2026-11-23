import "server-only";

import { and, eq, exists, gte, inArray, isNotNull, isNull, lt, lte, notInArray, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";

import { db } from "@/db";
import {
  activity,
  notification,
  notificationDelivery,
  pushToken,
  tripMembership,
  user,
  userNotificationSettings,
  type DeliveryChannel,
} from "@/db/schema";
import { planPushes, type Limits, type PendingPush, type PlannedPush } from "@floc/core/notifications/push-plan";
import { INBOX_KEEP_DAYS, LIMIT_FREE_KINDS, isReminder, skipsLimits, type ActivityKind } from "@floc/core/notifications/rules";
import { touch } from "@/server/audit";
import { answeredHref, notificationRows, stillVisible } from "@/server/notifications/visible";

const CLAIM_LEASE_MS = 5 * 60_000;
const BATCH = 500;
const DAY_MS = 86_400_000;
const WAITING_WINDOW_MS = (INBOX_KEEP_DAYS + 1) * DAY_MS;

export type Channel = {
  name: DeliveryChannel;
  waitMs: number;
  limits: Limits;
  reaches: () => SQL | undefined;
  words: (kind: ActivityKind, parts: { actor: string; trip: string | null; detail: string | null }) => string;
};

export function deliveriesFor(activityId: number | SQL): SQL {
  return sql`insert into notification_delivery (notification_id, channel)
    select notification.id, channels.value
    from notification, json_each('["push","email"]') as channels
    where notification.activity_id = ${activityId} and notification.loud = 1
    on conflict (notification_id, channel) do update set last_modified_at = unixepoch()
    where notification_delivery.sent_at is null`;
}

const recipientAlerts = alias(userNotificationSettings, "recipient_alerts");

export const switchedOff = (key: "notifyPush" | "notifyEmail") =>
  exists(
    db
      .select({ userId: recipientAlerts.userId })
      .from(recipientAlerts)
      .where(and(eq(recipientAlerts.userId, notification.userId), eq(recipientAlerts[key], false))),
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

const unclaimed = (now: Date) =>
  or(isNull(notificationDelivery.claimedAt), lt(notificationDelivery.claimedAt, new Date(now.getTime() - CLAIM_LEASE_MS)));

const waiting = (channel: Channel, now: Date) =>
  and(
    eq(notificationDelivery.channel, channel.name),
    isNull(notificationDelivery.sentAt),
    isNull(notificationDelivery.deletedAt),
    unclaimed(now),
  );

async function due(channel: Channel, now: Date): Promise<PendingPush[]> {
  const stillWaiting = db
    .select({ id: notificationDelivery.notificationId })
    .from(notificationDelivery)
    .where(and(waiting(channel, now), gte(notificationDelivery.lastModifiedAt, new Date(Date.now() - WAITING_WINDOW_MS))));
  const rows = await notificationRows(
    and(
      inArray(notification.id, stillWaiting),
      eq(notification.loud, true),
      isNull(notification.readAt),
      lte(activity.lastModifiedAt, new Date(now.getTime() - channel.waitMs)),
      stillVisible(),
      isNotNull(answeredHref()),
      isNull(tripMembership.mutedAt),
      channel.reaches(),
    ),
    BATCH,
  );
  return rows.flatMap((r) => r.href === null ? [] : [{
    notificationId: r.id,
    userId: r.userId,
    tripId: r.tripId,
    tripName: r.tripName,
    text: channel.words(r.kind, { actor: r.actorDisplayName ?? r.actorName, trip: r.tripName, detail: r.detail }),
    href: r.href,
    kind: r.kind,
    actor: isReminder(r.kind) ? null : (r.actorDisplayName ?? r.actorName),
    ...(skipsLimits(r.kind) ? { exempt: true as const } : {}),
  }]);
}

async function sentToday(channel: Channel, now: Date) {
  const rows = await db
    .selectDistinct({ userId: notification.userId, tripId: activity.tripId, sentAt: notificationDelivery.sentAt })
    .from(notificationDelivery)
    .innerJoin(notification, eq(notification.id, notificationDelivery.notificationId))
    .innerJoin(activity, eq(activity.id, notification.activityId))
    .where(
      and(
        eq(notificationDelivery.channel, channel.name),
        isNotNull(notificationDelivery.sentAt),
        gte(notificationDelivery.sentAt, new Date(now.getTime() - DAY_MS)),
        notInArray(activity.kind, LIMIT_FREE_KINDS),
      ),
    )
    .all();
  return rows.map((r) => ({ userId: r.userId, tripId: r.tripId, sentAt: r.sentAt! }));
}

export async function planDue(channel: Channel, now: Date): Promise<PlannedPush[]> {
  return planPushes(await due(channel, now), await sentToday(channel, now), now, channel.limits);
}

const these = (channel: Channel, ids: number[]) =>
  and(eq(notificationDelivery.channel, channel.name), inArray(notificationDelivery.notificationId, ids));

export async function claim(channel: Channel, ids: number[], now: Date): Promise<number[]> {
  const won = await db
    .update(notificationDelivery)
    .set({ claimedAt: now })
    .where(and(waiting(channel, now), inArray(notificationDelivery.notificationId, ids)))
    .returning({ id: notificationDelivery.notificationId })
    .all();
  return won.map((w) => w.id);
}

export async function release(channel: Channel, ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  await db.update(notificationDelivery).set({ claimedAt: null }).where(these(channel, ids));
}

export async function markSent(channel: Channel, ids: number[], now: Date): Promise<void> {
  if (ids.length === 0) return;
  await db
    .update(notificationDelivery)
    .set({ sentAt: now, ...touch() })
    .where(these(channel, ids));
}
