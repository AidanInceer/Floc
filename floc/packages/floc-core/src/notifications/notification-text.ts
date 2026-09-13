import type { ActivityKind } from "./rules";

/** What the person did, and the word that joins it to the trip — null when there is no trip to name. */
const LINES: Record<ActivityKind, { did: string; joins: string | null }> = {
  comment_added: { did: "commented", joins: "on" },
  comment_replied: { did: "replied to a comment", joins: "on" },
  expense_added: { did: "added an expense", joins: "to" },
  expense_changed: { did: "changed an expense", joins: "on" },
  settlement_recorded: { did: "recorded a payment", joins: "on" },
  nudge_sent: { did: "nudged you", joins: "about" },
  packing_claim_changed: { did: "removed something you were bringing", joins: "to" },
  trip_dates_changed: { did: "changed the dates", joins: "of" },
  days_added: { did: "added days", joins: "to" },
  days_removed: { did: "removed a day", joins: "from" },
  member_joined: { did: "joined", joins: "" },
  member_left: { did: "left", joins: "" },
  trip_invited: { did: "invited you", joins: "to" },
  friend_requested: { did: "sent you a friend request", joins: null },
  friend_accepted: { did: "accepted your friend request", joins: null },
};

/** One line for the inbox, the same on web and phone. */
export function notificationText(kind: ActivityKind, actor: string, tripName: string | null): string {
  const { did, joins } = LINES[kind];
  if (joins === null) return `${actor} ${did}`;
  return [actor, did, joins, tripName ?? "a trip"].filter(Boolean).join(" ");
}

/** The push body: its title is already the trip, so the trip is not said twice (#345). */
export function pushText(kind: ActivityKind, actor: string): string {
  const { did, joins } = LINES[kind];
  return joins === "" ? `${actor} ${did} the trip` : `${actor} ${did}`;
}
