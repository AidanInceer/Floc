/**
 * The currencies the v1 UI offers. A product decision, expected to grow.
 *
 * Here rather than in `db/schema.ts` (ticket 115) because `lib/` is the pure
 * half (ticket 107) and `computeBalances` needs the *list*, not just the type.
 * Importing the value out of the schema module would have pulled the whole
 * Drizzle table graph into anything that touches money, Client Components
 * included — so the dependency points the other way: the schema names its
 * column from this list, which is the right direction anyway. The vocabulary is
 * the domain's, and storage follows it.
 */
export const CURRENCIES = ["GBP", "EUR", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];
