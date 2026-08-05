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
export type TabKey =
  | "overview"
  | "ideas"
  | "dates"
  | "route"
  | "days"
  | "money";

export type TabState = { key: TabKey; label: string };

export const TABS: TabState[] = [
  { key: "overview", label: "Overview" },
  { key: "ideas", label: "Ideas" },
  // Dates sits third, between the suggesting and the sequencing: you can't
  // usefully build a route until the group knows which week it's going, and a
  // trip is allowed to exist with no dates at all until then.
  { key: "dates", label: "Dates" },
  { key: "route", label: "Route" },
  { key: "days", label: "Days" },
  { key: "money", label: "Money" },
];
