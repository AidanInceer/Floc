import { isReceipt, isReminder, type ActivityKind, type ReceiptKind, type ReminderKind } from "./rules";
import { isPlanChange, readPlanChange } from "./plan-change";
import { NUDGE_TODO, readNudgeTask } from "../trip/nudge/nudge";

type Change = Exclude<ActivityKind, ReminderKind | ReceiptKind>;

const RECEIPTS: Record<ReceiptKind, (trip: string) => string> = {
  booking_filed: (trip) => `Your booking was saved to ${trip}`,
  booking_waiting: () => "A booking is waiting for you to choose its trip",
};

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
  wish_list_invited: { did: "invited you to a wish list", joins: null },
  wish_list_joined: { did: "joined your wish list", joins: null },
  event_added: { did: "added an event", joins: "to" },
  event_moved: { did: "moved an event", joins: "on" },
  event_removed: { did: "removed an event", joins: "from" },
  file_added: { did: "added a file", joins: "to" },
};

const NAMED_VERBS: Partial<Record<ActivityKind, string>> = {
  event_added: "added",
  event_moved: "moved",
  event_removed: "removed",
  file_added: "added",
};

function namedThing(kind: ActivityKind, detail: string | null | undefined): string | null {
  if (kind === "file_added") return detail || null;
  return isPlanChange(kind) ? (readPlanChange(detail)?.title ?? null) : null;
}

const NEXT_TRIP = "Have you thought about your next trip yet?";

const REMINDERS: Record<ReminderKind, { inbox: (trip: string, detail: string) => string; push: (detail: string) => string }> = {
  trip_starts_week: { inbox: (t) => `${t} starts in a week`, push: () => "Starts in a week" },
  trip_starts_today: { inbox: (t) => `${t} starts today`, push: () => "Starts today" },
  still_owe: { inbox: (t, d) => `You still owe ${d} for ${t}`, push: (d) => `You still owe ${d}` },
  year_ago: { inbox: (t) => `One year ago today: ${t}`, push: () => "One year ago today" },
  still_owe_week: { inbox: (t, d) => `You still owe ${d} for ${t}`, push: (d) => `You still owe ${d}` },
  still_owe_month: { inbox: (t, d) => `You still owe ${d} for ${t}`, push: (d) => `You still owe ${d}` },
  next_trip_2m: { inbox: () => NEXT_TRIP, push: () => NEXT_TRIP },
  next_trip_6m: { inbox: () => NEXT_TRIP, push: () => NEXT_TRIP },
};

type Parts = { actor: string; trip: string | null; detail?: string | null };

export function notificationText(kind: ActivityKind, { actor, trip, detail }: Parts): string {
  const tripName = trip ?? "a trip";
  if (isReminder(kind)) return REMINDERS[kind].inbox(tripName, detail ?? "");
  if (isReceipt(kind)) return RECEIPTS[kind](tripName);
  const task = kind === "nudge_sent" ? readNudgeTask(detail) : null;
  if (task) return `${actor} nudged you to ${NUDGE_TODO[task]} on the trip ${tripName}`;
  const { did, joins } = LINES[kind];
  const named = namedThing(kind, detail);
  if (named) return `${actor} ${NAMED_VERBS[kind]} ${named} ${joins} ${tripName}`;
  if (joins === null) return `${actor} ${did}`;
  return [actor, did, joins, tripName].filter(Boolean).join(" ");
}

export function pushText(kind: ActivityKind, { actor, detail }: Omit<Parts, "trip">): string {
  if (isReminder(kind)) return REMINDERS[kind].push(detail ?? "");
  if (isReceipt(kind)) return RECEIPTS[kind]("your trip");
  const task = kind === "nudge_sent" ? readNudgeTask(detail) : null;
  if (task) return `${actor} nudged you to ${NUDGE_TODO[task]}`;
  const { did, joins } = LINES[kind];
  return joins === "" ? `${actor} ${did} the trip` : `${actor} ${did}`;
}
