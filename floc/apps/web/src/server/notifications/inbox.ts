import "server-only";

import { and, eq, isNull, lt, or } from "drizzle-orm";

import { db } from "@/db";
import { activity, notification } from "@/db/schema";
import { notificationText } from "@floc/core/notifications/notification-text";
import { INBOX_PAGE, type ActivityKind } from "@floc/core/notifications/rules";
import { touch } from "@/server/audit";
import { countNotifications, notificationRows, stillVisible } from "@/server/notifications/visible";

export type InboxItem = {
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

function toItem(r: Awaited<ReturnType<typeof notificationRows>>[number]): InboxItem {
  return {
    id: r.id,
    kind: r.kind,
    text: notificationText(r.kind, { actor: r.actorDisplayName ?? r.actorName, trip: r.tripName, detail: r.detail }),
    href: r.href,
    loud: r.loud,
    read: r.readAt !== null,
    at: r.at,
  };
}

export async function listInbox(userId: string, cursor: string | null): Promise<InboxPage> {
  const rows = await notificationRows(and(visibleTo(userId), parseCursor(cursor)), INBOX_PAGE);

  const items = rows.map(toItem);
  const last = items.at(-1);
  return {
    items,
    next: items.length === INBOX_PAGE && last ? `${last.at.getTime()}-${last.id}` : null,
  };
}

export async function countUnread(userId: string): Promise<number> {
  return countNotifications(and(visibleTo(userId), isNull(notification.seenAt)), 100);
}

export async function listUnseen(userId: string, limit: number): Promise<InboxItem[]> {
  const rows = await notificationRows(and(visibleTo(userId), isNull(notification.seenAt)), limit);
  return rows.map(toItem);
}

export async function markInboxSeen(userId: string): Promise<void> {
  await db
    .update(notification)
    .set({ seenAt: new Date(), ...touch() })
    .where(and(eq(notification.userId, userId), isNull(notification.seenAt), isNull(notification.deletedAt)))
    .run();
}

export async function markAllRead(userId: string): Promise<void> {
  const now = new Date();
  await db
    .update(notification)
    .set({ readAt: now, seenAt: now, ...touch() })
    .where(and(eq(notification.userId, userId), isNull(notification.readAt), isNull(notification.deletedAt)))
    .run();
}

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
