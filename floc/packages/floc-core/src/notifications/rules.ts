/**
 * Who hears about a change, and how loudly (#344). The approach is
 * docs/product/notifications/index.html.
 */

export const ACTIVITY_KINDS = [
  "comment_added",
  "comment_replied",
  "expense_added",
  "expense_changed",
  "settlement_recorded",
  "nudge_sent",
  "packing_claim_changed",
  "trip_dates_changed",
  "days_added",
  "days_removed",
  "member_joined",
  "member_left",
  "trip_invited",
  "friend_requested",
  "friend_accepted",
  "wish_list_invited",
  "wish_list_joined",
  "trip_starts_week",
  "trip_starts_today",
  "still_owe",
  "year_ago",
  "still_owe_week",
  "still_owe_month",
  "next_trip_2m",
  "next_trip_6m",
  "booking_filed",
  "booking_waiting",
] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

/**
 * Dates, not changes (#346): made by the cron, never by a person, and exempt from the send limits.
 * Why: `still_owe` is no longer sent (#626) but stays so its old inbox rows still read.
 */
export const REMINDER_KINDS = [
  "trip_starts_week",
  "trip_starts_today",
  "still_owe",
  "year_ago",
  "still_owe_week",
  "still_owe_month",
  "next_trip_2m",
  "next_trip_6m",
] as const satisfies ActivityKind[];
export type ReminderKind = (typeof REMINDER_KINDS)[number];

export function isReminder(kind: ActivityKind): kind is ReminderKind {
  return (REMINDER_KINDS as readonly ActivityKind[]).includes(kind);
}

/** A receipt for the person's own forwarded booking (#559): only they hear it, in the inbox, never by push or mail. */
export const RECEIPT_KINDS = ["booking_filed", "booking_waiting"] as const satisfies ActivityKind[];
export type ReceiptKind = (typeof RECEIPT_KINDS)[number];

export function isReceipt(kind: ActivityKind): kind is ReceiptKind {
  return (RECEIPT_KINDS as readonly ActivityKind[]).includes(kind);
}

/** Kinds whose `subjectId` is a note — the inbox hides them once the note is gone. */
export const COMMENT_KINDS = ["comment_added", "comment_replied"] as const satisfies ActivityKind[];
export const EXPENSE_KINDS = ["expense_added", "expense_changed"] as const satisfies ActivityKind[];

/** Rapid edits by one person to one thing inside this window fold into one row. */
export const GROUP_WINDOW_MS = 5 * 60_000;
export const INBOX_KEEP_DAYS = 30;
export const INBOX_PAGE = 50;

type Rule = {
  /** `trip`: every other member hears it. `affected`: only the people named. */
  audience: "trip" | "affected" | "self";
  loud: "affected" | "everyone" | "nobody";
};

const RULES: Record<ActivityKind, Rule> = {
  comment_added: { audience: "trip", loud: "nobody" },
  comment_replied: { audience: "trip", loud: "affected" },
  expense_added: { audience: "trip", loud: "affected" },
  expense_changed: { audience: "trip", loud: "nobody" },
  settlement_recorded: { audience: "trip", loud: "affected" },
  nudge_sent: { audience: "affected", loud: "affected" },
  packing_claim_changed: { audience: "affected", loud: "affected" },
  trip_dates_changed: { audience: "trip", loud: "everyone" },
  days_added: { audience: "trip", loud: "nobody" },
  days_removed: { audience: "trip", loud: "nobody" },
  member_joined: { audience: "trip", loud: "nobody" },
  member_left: { audience: "trip", loud: "nobody" },
  trip_invited: { audience: "affected", loud: "affected" },
  friend_requested: { audience: "affected", loud: "affected" },
  friend_accepted: { audience: "affected", loud: "affected" },
  wish_list_invited: { audience: "affected", loud: "affected" },
  wish_list_joined: { audience: "affected", loud: "nobody" },
  trip_starts_week: { audience: "affected", loud: "affected" },
  trip_starts_today: { audience: "affected", loud: "affected" },
  still_owe: { audience: "affected", loud: "affected" },
  year_ago: { audience: "affected", loud: "affected" },
  still_owe_week: { audience: "affected", loud: "affected" },
  still_owe_month: { audience: "affected", loud: "affected" },
  next_trip_2m: { audience: "affected", loud: "affected" },
  next_trip_6m: { audience: "affected", loud: "affected" },
  booking_filed: { audience: "self", loud: "nobody" },
  booking_waiting: { audience: "self", loud: "nobody" },
};

export type Recipient = { userId: string; loud: boolean };

export function recipientsFor(change: {
  kind: ActivityKind;
  actorId: string;
  affected: string[];
  members: string[];
}): Recipient[] {
  const rule = RULES[change.kind];
  if (rule.audience === "self") return [{ userId: change.actorId, loud: false }];
  const affected = new Set(change.affected);
  const heard = rule.audience === "trip" ? [...change.members, ...affected] : [...affected];

  return [...new Set(heard)]
    .filter((userId) => userId !== change.actorId)
    .map((userId) => ({
      userId,
      loud: rule.loud === "everyone" || (rule.loud === "affected" && affected.has(userId)),
    }));
}
