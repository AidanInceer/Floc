/**
 * What a person reads out of the activity log (#344): their notifications,
 * newest first, minus anything whose thing is gone or whose trip they left.
 */
import "server-only";

import { and, eq, isNull, lt, or } from "drizzle-orm";

import { db } from "@/db";
import { activity, notification } from "@/db/schema";
import { notificationText } from "@floc/core/notifications/notification-text";
import { INBOX_PAGE, type ActivityKind } from "@floc/core/notifications/rules";
import { touch } from "@/server/audit";
import { countNotifications, notificationRows, stillVisible } from "@/server/notifications/visible";

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

const visibleTo = (userId: string) => and(eq(notification.userId, userId), stillVisible());

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
  const rows = await notificationRows(and(visibleTo(userId), parseCursor(cursor)), INBOX_PAGE);

  const items = rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    text: notificationText(r.kind, { actor: r.actorDisplayName ?? r.actorName, trip: r.tripName, detail: r.detail }),
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

/**
 * What the bell shows. Unseen, not unread: landing on the inbox answers the
 * bell, while each row keeps its own "New" mark until you open it (#403).
 * Capped: past 99 the bell says "99+", so counting further is wasted work.
 */
export async function countUnread(userId: string): Promise<number> {
  return countNotifications(and(visibleTo(userId), isNull(notification.seenAt)), 100);
}

/** Landing on the inbox: every row on screen has now been seen. */
export async function markInboxSeen(userId: string): Promise<void> {
  await db
    .update(notification)
    .set({ seenAt: new Date(), ...touch() })
    .where(and(eq(notification.userId, userId), isNull(notification.seenAt), isNull(notification.deletedAt)))
    .run();
}

/** The "Mark all as read" control: clears both marks at once. */
export async function markAllRead(userId: string): Promise<void> {
  const now = new Date();
  await db
    .update(notification)
    .set({ readAt: now, seenAt: now, ...touch() })
    .where(and(eq(notification.userId, userId), isNull(notification.readAt), isNull(notification.deletedAt)))
    .run();
}

/** Marks one of your own notifications read and says where it points. Null for anyone else's id. */
export async function openNotification(userId: string, notificationId: number): Promise<string | null> {
  const opened = await db
    .update(notification)
    .set({ readAt: new Date(), seenAt: new Date(), ...touch() })
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
