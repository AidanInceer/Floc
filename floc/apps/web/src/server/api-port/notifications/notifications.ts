import "server-only";

import type { FlocPort } from "@floc/api/port";

import {
  countUnread,
  listInbox,
  markAllRead,
  markInboxSeen,
  openNotification,
} from "@/server/notifications/inbox";
import { readPlanNote } from "@/server/notifications/plan-note";
import { forgetPushToken, registerPushToken } from "@/server/notifications/push";

type NotificationsPort = Pick<
  FlocPort,
  | "listNotifications"
  | "countUnreadNotifications"
  | "markNotificationsSeen"
  | "markAllNotificationsRead"
  | "openNotification"
  | "readPlanChangeNote"
  | "registerPushToken"
  | "forgetPushToken"
>;

export const notificationsPort: NotificationsPort = {
  async listNotifications(viewerId, cursor) {
    const page = await listInbox(viewerId, cursor);
    return {
      next: page.next,
      items: page.items.map((item) => ({
        id: item.id,
        text: item.text,
        href: item.href,
        loud: item.loud,
        read: item.read,
        at: item.at.toISOString(),
        tripId: item.tripId,
        tripName: item.tripName,
        change: item.change ? { date: item.change.date, time: item.change.time } : null,
        was: item.words?.was ?? null,
        now: item.words?.now ?? null,
        share: item.share,
      })),
    };
  },

  countUnreadNotifications: (viewerId) => countUnread(viewerId),

  markNotificationsSeen: (viewerId) => markInboxSeen(viewerId),

  markAllNotificationsRead: (viewerId) => markAllRead(viewerId),

  openNotification: (viewerId, notificationId) => openNotification(viewerId, notificationId),

  async readPlanChangeNote(viewerId, tripId, notificationId) {
    const note = await readPlanNote(viewerId, tripId, notificationId);
    if (!note) return null;
    const { change, words, at, ...rest } = note;
    return { ...rest, at: at.toISOString(), eventId: change.eventId, title: change.title, date: change.date, was: words.was, now: words.now };
  },

  registerPushToken: (viewerId, token) => registerPushToken(viewerId, token),

  forgetPushToken: (viewerId, token) => forgetPushToken(viewerId, token),
};
