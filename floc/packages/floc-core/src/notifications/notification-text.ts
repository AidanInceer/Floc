import { isReminder, type ActivityKind, type ReminderKind } from "./rules";

type Change = Exclude<ActivityKind, ReminderKind>;

/** What the person did, and the word that joins it to the trip — null when there is no trip to name. */
const LINES: Record<Change, { did: string; joins: string | null }> = {
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

const REMINDERS: Record<ReminderKind, { inbox: (trip: string, detail: string) => string; push: (detail: string) => string }> = {
  trip_starts_week: { inbox: (t) => `${t} starts in a week`, push: () => "Starts in a week" },
  trip_starts_today: { inbox: (t) => `${t} starts today`, push: () => "Starts today" },
  still_owe: { inbox: (t, d) => `You still owe ${d} for ${t}`, push: (d) => `You still owe ${d}` },
  year_ago: { inbox: (t) => `One year ago today: ${t}`, push: () => "One year ago today" },
};

type Parts = { actor: string; trip: string | null; detail?: string | null };

/** One line for the inbox and email, the same on web and phone. */
export function notificationText(kind: ActivityKind, { actor, trip, detail }: Parts): string {
  const tripName = trip ?? "a trip";
  if (isReminder(kind)) return REMINDERS[kind].inbox(tripName, detail ?? "");
  const { did, joins } = LINES[kind];
  if (joins === null) return `${actor} ${did}`;
  return [actor, did, joins, tripName].filter(Boolean).join(" ");
}

/** The push body: its title is already the trip, so the trip is not said twice (#345). */
export function pushText(kind: ActivityKind, { actor, detail }: Omit<Parts, "trip">): string {
  if (isReminder(kind)) return REMINDERS[kind].push(detail ?? "");
  const { did, joins } = LINES[kind];
  return joins === "" ? `${actor} ${did} the trip` : `${actor} ${did}`;
}
