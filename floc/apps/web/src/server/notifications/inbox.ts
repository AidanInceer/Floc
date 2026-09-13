/**
 * What a person reads out of the activity log (#344): their notifications,
 * newest first, minus anything whose thing is gone or whose trip they left.
 */
import "server-only";

import {
  and,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
  lt,
  ne,
  notInArray,
  or,
  type SQL,
} from "drizzle-orm";

import { db } from "@/db";
import {
  activity,
  expense,
  note,
  notification,
  settlement,
  trip,
  tripMembership,
  user,
  userProfile,
} from "@/db/schema";
import { notificationText } from "@floc/core/notifications/notification-text";
import {
  COMMENT_KINDS,
  EXPENSE_KINDS,
  INBOX_KEEP_DAYS,
  INBOX_PAGE,
  type ActivityKind,
} from "@floc/core/notifications/rules";
import { touch } from "@/server/audit";

type InboxItem = {
  id: number;
  kind: ActivityKind;
  text: string;
  href: string;
  loud: boolean;
  read: boolean;
  at: Date;
};

export type InboxPage = { items: InboxItem[]; next: string | null };

function inboxRows(where: SQL | undefined, limit: number) {
  return db
    .select({
      id: notification.id,
      kind: activity.kind,
      href: activity.href,
      loud: notification.loud,
      readAt: notification.readAt,
      at: activity.lastModifiedAt,
      tripName: trip.name,
      actorName: user.name,
      actorDisplayName: userProfile.displayName,
    })
    .from(notification)
    .innerJoin(activity, eq(activity.id, notification.activityId))
    .leftJoin(trip, eq(trip.id, activity.tripId))
    .leftJoin(
      tripMembership,
      and(
        eq(tripMembership.tripId, activity.tripId),
        eq(tripMembership.userId, notification.userId),
        isNull(tripMembership.deletedAt),
      ),
    )
    .leftJoin(note, and(eq(note.id, activity.subjectId), inArray(activity.kind, COMMENT_KINDS)))
    .leftJoin(expense, and(eq(expense.id, activity.subjectId), inArray(activity.kind, EXPENSE_KINDS)))
    .leftJoin(
      settlement,
      and(eq(settlement.id, activity.subjectId), eq(activity.kind, "settlement_recorded")),
    )
    .innerJoin(user, eq(user.id, activity.actorId))
    .leftJoin(userProfile, eq(userProfile.userId, activity.actorId))
    .where(where)
    .orderBy(desc(activity.lastModifiedAt), desc(notification.id))
    .limit(limit)
    .all();
}

function visibleTo(userId: string) {
  return and(
    eq(notification.userId, userId),
    isNull(notification.deletedAt),
    isNull(activity.deletedAt),
    gte(activity.lastModifiedAt, new Date(Date.now() - INBOX_KEEP_DAYS * 86_400_000)),
    or(
      isNull(activity.tripId),
      and(
        isNull(trip.deletedAt),
        or(isNotNull(tripMembership.userId), eq(activity.kind, "trip_invited")),
      ),
    ),
    or(notInArray(activity.kind, COMMENT_KINDS), isNull(note.deletedAt)),
    or(notInArray(activity.kind, EXPENSE_KINDS), isNull(expense.deletedAt)),
    or(ne(activity.kind, "settlement_recorded"), isNull(settlement.deletedAt)),
  );
}

/** `<ms>-<id>`: the time alone is not unique, so the id breaks the tie. */
function parseCursor(cursor: string | null) {
  const match = cursor?.match(/^(\d+)-(\d+)$/);
  if (!match) return undefined;
  const at = new Date(Number(match[1]));
  const id = Number(match[2]);
  return or(
    lt(activity.lastModifiedAt, at),
    and(eq(activity.lastModifiedAt, at), lt(notification.id, id)),
  );
}

export async function listInbox(userId: string, cursor: string | null): Promise<InboxPage> {
  const rows = await inboxRows(and(visibleTo(userId), parseCursor(cursor)), INBOX_PAGE);

  const items = rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    text: notificationText(r.kind, r.actorDisplayName ?? r.actorName, r.tripName),
    href: r.href,
    loud: r.loud,
    read: r.readAt !== null,
    at: r.at,
  }));
  const last = items.at(-1);
  return {
    items,
    next: items.length === INBOX_PAGE && last ? `${last.at.getTime()}-${last.id}` : null,
  };
}

/** Capped: past 99 the bell says "99+", so counting further is wasted work on every page. */
export async function countUnread(userId: string): Promise<number> {
  const rows = await inboxRows(and(visibleTo(userId), isNull(notification.readAt)), 100);
  return rows.length;
}

/** Marks one of your own notifications read and says where it points. Null for anyone else's id. */
export async function openNotification(userId: string, notificationId: number): Promise<string | null> {
  const opened = await db
    .update(notification)
    .set({ readAt: new Date(), ...touch() })
    .where(
      and(
        eq(notification.id, notificationId),
        eq(notification.userId, userId),
        isNull(notification.deletedAt),
      ),
    )
    .returning({ activityId: notification.activityId })
    .get();
  if (!opened) return null;

  const row = await db
    .select({ href: activity.href })
    .from(activity)
    .where(eq(activity.id, opened.activityId))
    .get();
  return row?.href ?? null;
}
