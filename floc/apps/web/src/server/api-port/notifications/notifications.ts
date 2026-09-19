import "server-only";

import type { FlocPort } from "@floc/api/port";

import { refresh } from "@/server/freshness";
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

  async markNotificationsSeen(viewerId) {
    await markInboxSeen(viewerId);
    refresh({ kind: "bell" });
  },

  async markAllNotificationsRead(viewerId) {
    await markAllRead(viewerId);
    refresh({ kind: "inbox" });
  },

  async openNotification(viewerId, notificationId) {
    const href = await openNotification(viewerId, notificationId);
    refresh({ kind: "inbox" });
    return href;
  },

  registerPushToken: (viewerId, token) => registerPushToken(viewerId, token),

  forgetPushToken: (viewerId, token) => forgetPushToken(viewerId, token),
};
