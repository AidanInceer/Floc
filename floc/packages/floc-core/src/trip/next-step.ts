/**
 * The one step Overview points to (#312). Derived from data, never stored:
 * a step is empty or has something, and there is no "done".
 */
export type NextStepKey = "invite" | "dates" | "days" | "money" | "packing";

export type NextStep = { key: NextStepKey; said: string; action: string };

export type NextStepInput = {
  memberCount: number;
  datesUnset: boolean;
  dayCount: number;
  expenseCount: number;
  viewerHasPacking: boolean;
};

const STEPS: Record<NextStepKey, NextStep> = {
  invite: { key: "invite", said: "Just you so far.", action: "Invite people" },
  dates: { key: "dates", said: "No dates yet.", action: "Pick dates" },
  days: { key: "days", said: "No days planned yet.", action: "Plan the days" },
  money: { key: "money", said: "No costs logged yet.", action: "Log a cost" },
  packing: { key: "packing", said: "Nothing in your bag yet.", action: "Start your bag" },
};

export function nextStepFor(input: NextStepInput): NextStep | null {
  // Why: setting dates alone is how a solo trip says it stays solo — no flag.
  if (input.memberCount <= 1 && input.datesUnset) return STEPS.invite;
  if (input.datesUnset) return STEPS.dates;
  if (input.dayCount === 0) return STEPS.days;
  if (input.expenseCount === 0) return STEPS.money;
  if (!input.viewerHasPacking) return STEPS.packing;
  return null;
}
