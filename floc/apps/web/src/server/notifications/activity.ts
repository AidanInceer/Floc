import "server-only";

import { and, desc, eq, gte, isNull, sql, type SQL } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";

import { db } from "@/db";
import { activity, notification, tripMembership } from "@/db/schema";
import {
  GROUP_WINDOW_MS,
  recipientsFor,
  type ActivityKind,
} from "@floc/core/notifications/rules";
import { touch } from "@/server/audit";
import { deliveriesFor } from "@/server/notifications/outbox";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type Change = {
  kind: ActivityKind;
  tripId: number | null;
  actorId: string;
  subjectId: number | null;
  href: string;
  affected: string[];
  detail?: string | null;
};

export type KnownBefore = {
  members?: string[];
  fresh?: boolean;
};

export async function liveMemberIds(tx: Tx | typeof db, tripId: number | null): Promise<string[]> {
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

export function groupedActivityWrites(
  change: Omit<Change, "subjectId"> & { tripId: number; subjectId: number | SQL | null },
  members: string[],
): BatchItem<"sqlite">[] {
  const recipients = recipientsFor({
    kind: change.kind,
    actorId: change.actorId,
    affected: change.affected,
    members,
  });
  const latest = db
    .select({ id: activity.id })
    .from(activity)
    .where(
      and(
        eq(activity.actorId, change.actorId),
        eq(activity.kind, change.kind),
        eq(activity.tripId, change.tripId),
        change.subjectId === null ? isNull(activity.subjectId) : eq(activity.subjectId, change.subjectId),
        gte(activity.lastModifiedAt, new Date(Date.now() - GROUP_WINDOW_MS)),
        isNull(activity.deletedAt),
      ),
    )
    .orderBy(desc(activity.id))
    .limit(1);
  const detail = change.detail ?? null;
  const writes: BatchItem<"sqlite">[] = [
    db.update(activity).set(touch()).where(eq(activity.id, sql`${latest}`)),
    db.run(sql`insert into activity (kind, trip_id, actor_id, subject_id, href, detail)
      select ${change.kind}, ${change.tripId}, ${change.actorId}, ${change.subjectId}, ${change.href}, ${detail}
      where not exists ${latest}`),
  ];
  if (recipients.length === 0) return writes;
  const rows = JSON.stringify(recipients.map((r) => ({ userId: r.userId, loud: r.loud })));
  writes.push(
    db.run(sql`insert into notification (activity_id, user_id, loud)
      select ${latest}, json_extract(value, '$.userId'), json_extract(value, '$.loud')
      from json_each(${rows}) where true
      on conflict (activity_id, user_id) do update set last_modified_at = unixepoch()`),
    db.run(deliveriesFor(sql`${latest}`)),
  );
  return writes;
}

export async function recordActivity(tx: Tx, change: Change, known: KnownBefore = {}): Promise<void> {
  const recipients = recipientsFor({
    kind: change.kind,
    actorId: change.actorId,
    affected: change.affected,
    members: known.members ?? (await liveMemberIds(tx, change.tripId)),
  });

  let activityId = known.fresh ? undefined : await recentSameChange(tx, change);
  if (activityId === undefined) {
    const row = await tx
      .insert(activity)
      .values({
        kind: change.kind,
        tripId: change.tripId,
        actorId: change.actorId,
        subjectId: change.subjectId,
        href: change.href,
        detail: change.detail ?? null,
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
    .onConflictDoUpdate({ target: [notification.activityId, notification.userId], set: touch() });
  await tx.run(deliveriesFor(activityId));
}
