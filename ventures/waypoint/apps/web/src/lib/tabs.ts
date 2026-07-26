/**
 * Tab identity and lock state (ticket 05's tab set, ticket 04's sticky
 * unlocks).
 *
 * Deliberately free of any database import: the trip tab bar is a client
 * component, so anything it needs must be safe to bundle for the browser. The
 * write side of unlocking lives in `unlocks.ts`, which is server-only.
 */
import type { Trip } from "@/db/schema";

export type TabKey =
  | "overview"
  | "ideas"
  | "dates"
  | "route"
  | "days"
  | "money";

export type TabState = { key: TabKey; label: string; locked: boolean };

/**
 * Money, Overview and Dates are never gated; Chase is a panel, not a tab.
 * Dates sits third, between the suggesting and the sequencing: you can't
 * usefully build a route until the group knows which week it's going, and a
 * trip is allowed to exist with no dates at all until then.
 */
export function tabStates(
  t: Pick<Trip, "routeUnlockedAt" | "daysUnlockedAt">,
): TabState[] {
  return [
    { key: "overview", label: "Overview", locked: false },
    { key: "ideas", label: "Ideas", locked: false },
    { key: "dates", label: "Dates", locked: false },
    { key: "route", label: "Route", locked: !t.routeUnlockedAt },
    { key: "days", label: "Days", locked: !t.daysUnlockedAt },
    { key: "money", label: "Money", locked: false },
  ];
}

export function lockReason(key: TabKey): string | null {
  switch (key) {
    case "route":
      return "Unlocks once someone posts an idea";
    case "days":
      return "Unlocks once the trip has a day or a stop";
    default:
      return null;
  }
}
