import type { ActivityKind } from "./rules";

const LINES: Record<ActivityKind, (actor: string, trip: string) => string> = {
  comment_added: (a, t) => `${a} commented on ${t}`,
  comment_replied: (a, t) => `${a} replied to a comment on ${t}`,
  expense_added: (a, t) => `${a} added an expense to ${t}`,
  expense_changed: (a, t) => `${a} changed an expense on ${t}`,
  settlement_recorded: (a, t) => `${a} recorded a payment on ${t}`,
  nudge_sent: (a, t) => `${a} nudged you about ${t}`,
  packing_claim_changed: (a, t) => `${a} removed something you were bringing to ${t}`,
  trip_dates_changed: (a, t) => `${a} changed the dates of ${t}`,
  days_added: (a, t) => `${a} added days to ${t}`,
  days_removed: (a, t) => `${a} removed a day from ${t}`,
  member_joined: (a, t) => `${a} joined ${t}`,
  member_left: (a, t) => `${a} left ${t}`,
  trip_invited: (a, t) => `${a} invited you to ${t}`,
  friend_requested: (a) => `${a} sent you a friend request`,
  friend_accepted: (a) => `${a} accepted your friend request`,
};

/** One line for the inbox, the same on web and phone. */
export function notificationText(kind: ActivityKind, actor: string, tripName: string | null): string {
  return LINES[kind](actor, tripName ?? "a trip");
}
