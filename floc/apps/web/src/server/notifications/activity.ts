/**
 * The activity log's one write (#344). Every writer that changes a fact people
 * hear about calls `recordActivity` inside its own transaction, so a change and
 * its row land together or not at all.
 */
import "server-only";

import { and, eq, gte, isNull } from "drizzle-orm";

import { db } from "@/db";
import { activity, notification, tripMembership } from "@/db/schema";
import {
  GROUP_WINDOW_MS,
  recipientsFor,
  type ActivityKind,
} from "@floc/core/notifications/rules";
import { touch } from "@/server/audit";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type Change = {
  kind: ActivityKind;
  tripId: number | null;
  actorId: string;
  subjectId: number | null;
  href: string;
  /** The people this change is about. The rules decide what that earns them. */
  affected: string[];
};

async function liveMemberIds(tx: Tx, tripId: number | null): Promise<string[]> {
  if (tripId === null) return [];
  const rows = await tx
    .select({ userId: tripMembership.userId })
    .from(tripMembership)
    .where(and(eq(tripMembership.tripId, tripId), isNull(tripMembership.deletedAt)))
    .all();
  return rows.map((r) => r.userId);
}

async function recentSameChange(tx: Tx, change: Change): Promise<number | undefined> {
  const row = await tx
    .select({ id: activity.id })
    .from(activity)
    .where(
      and(
        eq(activity.actorId, change.actorId),
        eq(activity.kind, change.kind),
        change.tripId === null ? isNull(activity.tripId) : eq(activity.tripId, change.tripId),
        change.subjectId === null ? isNull(activity.subjectId) : eq(activity.subjectId, change.subjectId),
        gte(activity.lastModifiedAt, new Date(Date.now() - GROUP_WINDOW_MS)),
        isNull(activity.deletedAt),
      ),
    )
    .get();
  return row?.id;
}

export async function recordActivity(tx: Tx, change: Change): Promise<void> {
  const recipients = recipientsFor({
    kind: change.kind,
    actorId: change.actorId,
    affected: change.affected,
    members: await liveMemberIds(tx, change.tripId),
  });

  let activityId = await recentSameChange(tx, change);
  if (activityId === undefined) {
    const row = await tx
      .insert(activity)
      .values({
        kind: change.kind,
        tripId: change.tripId,
        actorId: change.actorId,
        subjectId: change.subjectId,
        href: change.href,
      })
      .returning({ id: activity.id })
      .get();
    activityId = row.id;
  } else {
    await tx.update(activity).set(touch()).where(eq(activity.id, activityId));
  }

  if (recipients.length === 0) return;
  await tx
    .insert(notification)
    .values(recipients.map((r) => ({ activityId: activityId!, userId: r.userId, loud: r.loud })))
    .onConflictDoUpdate({
      target: [notification.activityId, notification.userId],
      set: { readAt: null, ...touch() },
    });
}
