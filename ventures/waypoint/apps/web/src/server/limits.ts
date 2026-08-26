/**
 * Ceilings on how much of anything one trip can hold (ticket 108) — added
 * after a review found 58 `.all()` calls and zero `.limit()`.
 *
 * Behaviour at the ceiling is truncate-and-say-so, not throw or paginate (rule
 * 11: degrade, don't crash); every one of these lists renders whole today, so
 * paginating means designing the paged view first. Truncation is loud on the
 * server (`reportCeiling`) and silent in the UI — nobody hits these by
 * accident.
 *
 * Raising a limit is a one-line change; lowering one is a ratchet — a trip
 * already over the new number would lose rows from view.
 */
import "server-only";

export const LIMITS = {
  /** Days in one trip. A year of itinerary; the longest real trip is shorter. */
  days: 366,
  /** Events on one day. A packed day is a dozen; a hundred is a runaway import. */
  eventsPerDay: 100,
  /** Ideas on one board. */
  ideas: 500,
  /** Expenses in one trip's ledger. */
  expenses: 2000,
  /** Split rows read back for one trip's balances. */
  expenseSplits: 10_000,
  /** Things on one trip's shared packing list. */
  packingLines: 500,
  /** People on one trip, and so also the size of the roster every page loads. */
  members: 100,
  /** Trips one account can be on — the walk when that account is deleted. */
  tripsPerUser: 500,
  /** Links parked against one trip. A shelf, not an archive. */
  tripLinks: 200,
  /** Open invites one account is sitting on, and invites out on one trip. */
  invites: 200,
  /** Availability marks read for the Dates grid: members × days, capped. */
  availability: 20_000,
} as const;

export type LimitKey = keyof typeof LIMITS;

/** Called when a read landed exactly on its ceiling. No PII, no ids beyond the trip's own — just a named log. */
export function reportCeiling(what: LimitKey, scope: string): void {
  console.warn(
    `[waypoint] ceiling reached: ${what} at ${LIMITS[what]} for ${scope} — the view is truncated (see server/limits.ts)`,
  );
}

/** Wraps a bounded read so "did we bound this query?" is answerable by grep. */
export function bounded<T>(rows: T[], what: LimitKey, scope: string): T[] {
  if (rows.length >= LIMITS[what]) reportCeiling(what, scope);
  return rows;
}
