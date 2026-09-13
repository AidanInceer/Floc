import "server-only";

import type { FlocPort } from "@floc/api/port";

import { refresh } from "@/server/freshness";
import { countUnread, listInbox, openNotification } from "@/server/notifications/inbox";

type NotificationsPort = Pick<
  FlocPort,
  "listNotifications" | "countUnreadNotifications" | "openNotification"
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

  async openNotification(viewerId, notificationId) {
    const href = await openNotification(viewerId, notificationId);
    refresh({ kind: "inbox" });
    return href;
  },
};
