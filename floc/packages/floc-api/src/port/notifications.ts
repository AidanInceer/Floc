export type NotificationItem = {
  id: number;
  text: string;
  href: string | null;
  loud: boolean;
  read: boolean;
  at: string;
  tripId: number | null;
  tripName: string | null;
  change: { date: string; time: string | null } | null;
  was: string | null;
  now: string | null;
  share: string | null;
};

export type NotificationPage = { items: NotificationItem[]; next: string | null };

export type PlanChangeNote = {
  id: number;
  kind: "event_added" | "event_moved" | "event_removed";
  actor: string;
  at: string;
  eventId: number;
  title: string;
  date: string;
  was: string | null;
  now: string | null;
  index: number;
  total: number;
  prevId: number | null;
  nextId: number | null;
};

export type NotificationsPort = {
  listNotifications(viewerId: string, cursor: string | null): Promise<NotificationPage>;

  countUnreadNotifications(viewerId: string): Promise<number>;

  markNotificationsSeen(viewerId: string): Promise<void>;

  markAllNotificationsRead(viewerId: string): Promise<void>;

  openNotification(viewerId: string, notificationId: number): Promise<string | null>;

  readPlanChangeNote(viewerId: string, tripId: number, notificationId: number): Promise<PlanChangeNote | null>;

  registerPushToken(viewerId: string, token: string): Promise<void>;

  forgetPushToken(viewerId: string, token: string): Promise<void>;
};
