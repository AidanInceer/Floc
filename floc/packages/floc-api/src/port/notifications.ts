/** The notifications half of the port (#573). The rules it carries are listed in `../port.ts`. */


export type NotificationItem = {
  id: number;
  text: string;
  /** A web path. The phone maps it with `phoneRoute` from `@floc/core`. */
  href: string;
  loud: boolean;
  read: boolean;
  at: string;
};

export type NotificationPage = { items: NotificationItem[]; next: string | null };

export type NotificationsPort = {
  /** Newest first, one page. Pass the last page's `next` for the page after. */
  listNotifications(viewerId: string, cursor: string | null): Promise<NotificationPage>;

  /** The bell's number: how many you have not yet laid eyes on. */
  countUnreadNotifications(viewerId: string): Promise<number>;

  /** The inbox is on screen, so the bell is answered. The rows stay unread. */
  markNotificationsSeen(viewerId: string): Promise<void>;

  /** Clears every row's "New" mark, and the bell with it. */
  markAllNotificationsRead(viewerId: string): Promise<void>;

  /** Marks it read on every device and says where it points. Null for an id that is not yours. */
  openNotification(viewerId: string, notificationId: number): Promise<string | null>;

  /** This phone may be pushed to, for this person. A token held by someone else moves to them. */
  registerPushToken(viewerId: string, token: string): Promise<void>;

  /** Stop pushing to this phone. Only its owner can. */
  forgetPushToken(viewerId: string, token: string): Promise<void>;
};
