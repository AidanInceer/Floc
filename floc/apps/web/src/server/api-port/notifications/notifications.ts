import "server-only";

import type { FlocPort } from "@floc/api/port";

import {
  countUnread,
  listInbox,
  markAllRead,
  markInboxSeen,
  openNotification,
} from "@/server/notifications/inbox";
import { forgetPushToken, registerPushToken } from "@/server/notifications/push";

type NotificationsPort = Pick<
  FlocPort,
  | "listNotifications"
  | "countUnreadNotifications"
  | "markNotificationsSeen"
  | "markAllNotificationsRead"
  | "openNotification"
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
      })),
    };
  },

  countUnreadNotifications: (viewerId) => countUnread(viewerId),

  markNotificationsSeen: (viewerId) => markInboxSeen(viewerId),

  markAllNotificationsRead: (viewerId) => markAllRead(viewerId),

  openNotification: (viewerId, notificationId) => openNotification(viewerId, notificationId),

  registerPushToken: (viewerId, token) => registerPushToken(viewerId, token),

  forgetPushToken: (viewerId, token) => forgetPushToken(viewerId, token),
};
