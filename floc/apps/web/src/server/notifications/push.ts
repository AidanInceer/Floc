/**
 * Phone push (#345). The cron calls `sendDuePushes` every 5 minutes; all state is
 * on the notification rows, so a restart or a second instance never loses or
 * doubles a push.
 */
import "server-only";

import { and, eq, exists, gte, inArray, isNotNull, isNull, lt, lte, or } from "drizzle-orm";

import { db } from "@/db";
import { activity, notification, pushToken } from "@/db/schema";
import { pushText } from "@floc/core/notifications/notification-text";
import { planPushes, PUSH_WAIT_MS, type PlannedPush } from "@floc/core/notifications/push-plan";
import { touch } from "@/server/audit";
import { notificationRows, stillVisible } from "@/server/notifications/visible";

const CLAIM_LEASE_MS = 5 * 60_000;
const BATCH = 500;

export type PushMessage = {
  to: string;
  title: string;
  body: string;
  data: { href: string; ids: number[] };
};

export type PushSender = (messages: PushMessage[]) => Promise<{ deadTokens: string[] }>;

export async function registerPushToken(userId: string, token: string): Promise<void> {
  const at = new Date();
  await db
    .insert(pushToken)
    .values({ userId, token, registeredAt: at })
    .onConflictDoUpdate({
      target: pushToken.token,
      set: { userId, registeredAt: at, deletedAt: null, ...touch() },
    });
}

export async function forgetPushToken(userId: string, token: string): Promise<void> {
  await db
    .update(pushToken)
    .set({ deletedAt: new Date(), ...touch() })
    .where(and(eq(pushToken.token, token), eq(pushToken.userId, userId)));
}

const hasPhone = () =>
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

async function duePushes(now: Date) {
  const rows = await notificationRows(
    and(
      eq(notification.loud, true),
      isNull(notification.readAt),
      isNull(notification.pushedAt),
      or(
        isNull(notification.pushClaimedAt),
        lt(notification.pushClaimedAt, new Date(now.getTime() - CLAIM_LEASE_MS)),
      ),
      lte(activity.lastModifiedAt, new Date(now.getTime() - PUSH_WAIT_MS)),
      stillVisible(),
      hasPhone(),
    ),
    BATCH,
  );
  return rows.map((r) => ({
    notificationId: r.id,
    userId: r.userId,
    tripId: r.tripId,
    tripName: r.tripName,
    text: pushText(r.kind, r.actorDisplayName ?? r.actorName),
    href: r.href,
  }));
}

async function sentToday(now: Date) {
  const rows = await db
    .selectDistinct({ userId: notification.userId, tripId: activity.tripId, sentAt: notification.pushedAt })
    .from(notification)
    .innerJoin(activity, eq(activity.id, notification.activityId))
    .where(and(isNotNull(notification.pushedAt), gte(notification.pushedAt, new Date(now.getTime() - 86_400_000))))
    .all();
  return rows.map((r) => ({ ...r, sentAt: r.sentAt! }));
}

/** Only rows this run wins are sent; a run that loses the race sends nothing for them. */
async function claim(push: PlannedPush, now: Date): Promise<number[]> {
  const won = await db
    .update(notification)
    .set({ pushClaimedAt: now })
    .where(
      and(
        inArray(notification.id, push.notificationIds),
        isNull(notification.pushedAt),
        or(
          isNull(notification.pushClaimedAt),
          lt(notification.pushClaimedAt, new Date(now.getTime() - CLAIM_LEASE_MS)),
        ),
      ),
    )
    .returning({ id: notification.id })
    .all();
  return won.map((w) => w.id);
}

async function phonesOf(userIds: string[]) {
  return db
    .select({ userId: pushToken.userId, token: pushToken.token })
    .from(pushToken)
    .where(and(inArray(pushToken.userId, userIds), isNull(pushToken.deletedAt)))
    .all();
}

export async function sendDuePushes(send: PushSender, now = new Date()): Promise<number> {
  const plan = planPushes(await duePushes(now), await sentToday(now), now);
  if (plan.length === 0) return 0;

  const claimed: number[] = [];
  const phones = await phonesOf([...new Set(plan.map((p) => p.userId))]);
  const messages: PushMessage[] = [];
  for (const push of plan) {
    const ids = await claim(push, now);
    if (ids.length === 0) continue;
    claimed.push(...ids);
    for (const phone of phones.filter((p) => p.userId === push.userId)) {
      messages.push({ to: phone.token, title: push.title, body: push.body, data: { href: push.href, ids } });
    }
  }
  if (messages.length === 0) return 0;

  let deadTokens: string[];
  try {
    ({ deadTokens } = await send(messages));
  } catch (error) {
    await db.update(notification).set({ pushClaimedAt: null }).where(inArray(notification.id, claimed));
    throw error;
  }

  await db.update(notification).set({ pushedAt: now, ...touch() }).where(inArray(notification.id, claimed));
  if (deadTokens.length > 0) {
    await db
      .update(pushToken)
      .set({ deletedAt: new Date(), ...touch() })
      .where(inArray(pushToken.token, deadTokens));
  }
  return messages.length;
}
