/**
 * Tab identity (ticket 05's tab set).
 *
 * Every tab is always open. Route and Days used to be gated behind sticky
 * `route_unlocked_at` / `days_unlocked_at` flags — the one piece of persisted
 * lifecycle state in v1 — and ticket 126 took them out: a tab that shows you
 * its own empty state teaches the same thing a padlock did, without a column
 * to keep honest or a page you're refused. Trip state is now derived from what
 * data exists, with no lifecycle state persisted at all.
 *
 * Deliberately free of any database import: the trip tab bar is a client
 * component, so anything it needs must be safe to bundle for the browser.
 */
type TabKey =
  | "overview"
  | "notes"
  | "dates"
  | "days"
  | "money"
  | "packing";

export type TabState = { key: TabKey; label: string };

/**
 * What a stored `nudge.tab` value is called on screen. The stored keys predate
 * the Ideas → Notes rename (ticket 238) and `route` predates that tab retiring,
 * so the key is not the label and a migration would buy nothing.
 */
export const TAB_LABELS: Record<string, string> = {
  ideas: "Notes",
  route: "Route",
  dates: "Dates",
  days: "Days",
  money: "Money",
};

export const TABS: TabState[] = [
  { key: "overview", label: "Overview" },
  { key: "notes", label: "Notes" },
  // Dates sits third, between the suggesting and the sketching: the trip's
  // dates are the itinerary's extent (ticket 140), so there are no days to
  // fill in until they're set — and a trip is allowed to exist with no dates
  // at all until then.
  { key: "dates", label: "Dates" },
  { key: "days", label: "Days" },
  { key: "money", label: "Money" },
  // Last: packing is the thing you do once the trip is settled (ticket 219).
  { key: "packing", label: "Packing" },
];
