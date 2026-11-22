export type NotificationItem = {
  id: number;
  text: string;
  href: string | null;
  loud: boolean;
  read: boolean;
  at: string;
};

export type NotificationPage = { items: NotificationItem[]; next: string | null };

export type NotificationsPort = {
  listNotifications(viewerId: string, cursor: string | null): Promise<NotificationPage>;

  countUnreadNotifications(viewerId: string): Promise<number>;

  markNotificationsSeen(viewerId: string): Promise<void>;

  markAllNotificationsRead(viewerId: string): Promise<void>;

  openNotification(viewerId: string, notificationId: number): Promise<string | null>;

  registerPushToken(viewerId: string, token: string): Promise<void>;

  forgetPushToken(viewerId: string, token: string): Promise<void>;
};
