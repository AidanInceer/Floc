/**
 * The ceilings on how much of anything one trip can hold (ticket 108).
 *
 * The review found 58 `.all()` calls and zero `.limit()`: nothing bounded a
 * result set, so an unusually busy trip degraded silently — slower and slower
 * pages, no line anywhere that says where "busy" stops being supported. A
 * number nobody wrote down is still a limit; it just isn't one anybody can see.
 *
 * **The decided behaviour at the ceiling is truncate-and-say-so**, not throw and
 * not paginate. Rule 11 is degrade, don't crash: a group whose itinerary somehow
 * ran past a year should still see their trip, and refusing to load it would be
 * the worst of the three. Paginating is the right answer eventually and the
 * wrong one now — every one of these lists is rendered whole (a calendar, a
 * board, a ledger), so paging them means designing the paged view first.
 *
 * Truncation is deliberately loud on the server (`reportCeiling`) and quiet in
 * the UI. Nobody hits these numbers by accident, and a banner about a limit
 * nobody has met would be noise on every page that renders one of these lists.
 *
 * Raising one is a one-line change here. Lowering one is not — a trip already
 * over the new number would lose rows from view, so treat these as a ratchet
 * in the same spirit as the coverage thresholds.
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

/**
 * Called when a read came back exactly at its ceiling — which is the only
 * signal we get, since the database has no more to tell us than "here are N".
 * Deliberately just a named log: no PII, no ids beyond the trip's own, and
 * nothing that changes what the caller returns.
 */
export function reportCeiling(what: LimitKey, scope: string): void {
  console.warn(
    `[waypoint] ceiling reached: ${what} at ${LIMITS[what]} for ${scope} — the view is truncated (see server/limits.ts)`,
  );
}

/**
 * Wraps a bounded read: pass the rows back untouched, and report if the count
 * landed on the ceiling. Every list read in `server/` goes through this so that
 * "did we bound this query?" is answerable by grep rather than by review.
 */
export function bounded<T>(rows: T[], what: LimitKey, scope: string): T[] {
  if (rows.length >= LIMITS[what]) reportCeiling(what, scope);
  return rows;
}
