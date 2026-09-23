/**
 * Ceilings on how much one trip can hold (#108).
 *
 * Why: truncate-and-say-so at the ceiling, not throw or paginate (rule 11) — every list here
 * renders whole, so paginating means designing the paged view first. Loud on the server, silent
 * in the UI. Raising a limit is one line; lowering one drops rows a trip can already see.
 */
import "server-only";

export const LIMITS = {
  /** Days in one trip. A year of itinerary; the longest real trip is shorter. */
  days: 366,
  /** Events on one day. A packed day is a dozen; a hundred is a runaway import. */
  eventsPerDay: 100,
  /** Expenses in one trip's ledger. */
  expenses: 2000,
  /** Split rows read back for one trip's balances. */
  expenseSplits: 10_000,
  /** Things on one trip's shared packing list. */
  packingLines: 500,
  /** Saved packing lists one account can keep. A shelf of kits, not an archive. */
  packingKits: 50,
  /** Things in one saved list. */
  packingKitItems: 200,
  /** People on one trip, and so also the size of the roster every page loads. */
  members: 100,
  /** Trips one account can be on — the walk when that account is deleted. */
  tripsPerUser: 500,
  /** Links parked against one trip. A shelf, not an archive. */
  tripLinks: 200,
  /** Open invites one account is sitting on, and invites out on one trip. */
  invites: 200,
  /** Files parked against one trip. A folder, not a drive. */
  documents: 500,
  /** Ideas on one trip. A shortlist, not a suggestion box. */
  ideas: 200,
  /** Availability marks read for the Dates grid: members × days, capped. */
  availability: 20_000,
} as const;

export type LimitKey = keyof typeof LIMITS;

// Why: no PII and no ids beyond the trip's own — a ceiling log is not an audit trail.
export function reportCeiling(what: LimitKey, scope: string): void {
  console.warn(
    `[floc] ceiling reached: ${what} at ${LIMITS[what]} for ${scope} — the view is truncated (see server/limits.ts)`,
  );
}

// Why: wrapping every bounded read makes "did we bound this query?" answerable by grep.
export function bounded<T>(rows: T[], what: LimitKey, scope: string): T[] {
  if (rows.length >= LIMITS[what]) reportCeiling(what, scope);
  return rows;
}
