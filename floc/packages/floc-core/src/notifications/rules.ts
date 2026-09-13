/**
 * Who hears about a change, and how loudly (#344). The approach is
 * docs/architecture/notifications.html.
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
] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

/** Kinds whose `subjectId` is a note — the inbox hides them once the note is gone. */
export const COMMENT_KINDS = ["comment_added", "comment_replied"] as const satisfies ActivityKind[];
export const EXPENSE_KINDS = ["expense_added", "expense_changed"] as const satisfies ActivityKind[];

/** Rapid edits by one person to one thing inside this window fold into one row. */
export const GROUP_WINDOW_MS = 5 * 60_000;
export const INBOX_KEEP_DAYS = 30;
export const INBOX_PAGE = 50;

type Rule = {
  /** `trip`: every other member hears it. `affected`: only the people named. */
  audience: "trip" | "affected";
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
};

export type Recipient = { userId: string; loud: boolean };

export function recipientsFor(change: {
  kind: ActivityKind;
  actorId: string;
  affected: string[];
  members: string[];
}): Recipient[] {
  const rule = RULES[change.kind];
  const affected = new Set(change.affected);
  const heard = rule.audience === "trip" ? [...change.members, ...affected] : [...affected];

  return [...new Set(heard)]
    .filter((userId) => userId !== change.actorId)
    .map((userId) => ({
      userId,
      loud: rule.loud === "everyone" || (rule.loud === "affected" && affected.has(userId)),
    }));
}
