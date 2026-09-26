/**
 * Phone push (#345). The cron calls `sendDuePushes` every 5 minutes; all state is
 * on the notification rows, so a restart or a second instance never loses or
 * doubles a push.
 */
import "server-only";

import { and, eq, inArray, isNull, not } from "drizzle-orm";

import { db } from "@/db";
import { pushToken } from "@/db/schema";
import { pushText } from "@floc/core/notifications/notification-text";
import { PUSH_LIMITS, PUSH_WAIT_MS } from "@floc/core/notifications/push-plan";
import { touch } from "@/server/audit";
import { claim, hasPhone, markSent, planDue, release, switchedOff, type Channel } from "@/server/notifications/outbox";

export type PushMessage = {
  to: string;
  title: string;
  body: string;
  data: { href: string; ids: number[] };
};

/** `failed` are the messages that did not go; a throw means none did. */
export type PushSender = (messages: PushMessage[]) => Promise<{ deadTokens: string[]; failed?: PushMessage[] }>;

const PUSH: Channel = {
  claimKey: "pushClaimedAt",
  sentKey: "pushedAt",
  waitMs: PUSH_WAIT_MS,
  limits: PUSH_LIMITS,
  reaches: () => and(hasPhone(), not(switchedOff("notifyPush"))),
  words: (kind, parts) => pushText(kind, parts),
};

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

async function phonesOf(userIds: string[]) {
  return db
    .select({ userId: pushToken.userId, token: pushToken.token })
    .from(pushToken)
    .where(and(inArray(pushToken.userId, userIds), isNull(pushToken.deletedAt)))
    .all();
}

export async function sendDuePushes(send: PushSender, now = new Date()): Promise<number> {
  const plan = await planDue(PUSH, now);
  if (plan.length === 0) return 0;

  const claimed: number[] = [];
  const phones = await phonesOf([...new Set(plan.map((p) => p.userId))]);
  const messages: PushMessage[] = [];
  for (const push of plan) {
    const ids = await claim(PUSH, push.notificationIds, now);
    if (ids.length === 0) continue;
    claimed.push(...ids);
    for (const phone of phones.filter((p) => p.userId === push.userId)) {
      messages.push({ to: phone.token, title: push.title, body: push.body, data: { href: push.href, ids } });
    }
  }
  if (messages.length === 0) return 0;

  let result: Awaited<ReturnType<PushSender>>;
  try {
    result = await send(messages);
  } catch (error) {
    await release(PUSH, claimed);
    throw error;
  }

  // A notification with several phones counts as sent once any one of them got it.
  const failed = new Set(result.failed ?? []);
  const reached = new Set(messages.filter((m) => !failed.has(m)).flatMap((m) => m.data.ids));
  await markSent(PUSH, claimed.filter((id) => reached.has(id)), now);
  const unsent = claimed.filter((id) => !reached.has(id));
  if (unsent.length > 0) await release(PUSH, unsent);

  const { deadTokens } = result;
  if (deadTokens.length > 0) {
    await db
      .update(pushToken)
      .set({ deletedAt: new Date(), ...touch() })
      .where(inArray(pushToken.token, deadTokens));
  }
  return messages.length;
}
