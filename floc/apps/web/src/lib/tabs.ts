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
  | "packing"
  | "files";

export type TabState = { key: TabKey; label: string };

/**
 * What a stored `nudge.tab` value is called on screen. `route` predates that
 * tab retiring, so the key is not always the label.
 */
export const TAB_LABELS: Record<string, string> = {
  notes: "Notes",
  route: "Route",
  dates: "Dates",
  days: "Days",
  money: "Money",
};

/** Planning order (#315): the steps Overview nudges through, then the trip's paper. */
export const TABS: TabState[] = [
  { key: "overview", label: "Overview" },
  { key: "dates", label: "Dates" },
  { key: "days", label: "Days" },
  { key: "money", label: "Money" },
  { key: "packing", label: "Packing" },
  { key: "notes", label: "Notes" },
  { key: "files", label: "Files" },
];
