/**
 * Display-only FX (money overhaul; cached by ticket 253). The ledger is always
 * stored in the currency an expense or settlement was recorded in — this backs
 * the totals toggle and pre-fills a cross-currency settle-up, which snapshots
 * its own rate onto the settlement row. No balance is ever derived from here.
 *
 * Free daily rates from frankfurter.app (no key). Successful fetches are
 * written to `fx_rate`; when the provider is down the newest cached quote is
 * served instead, carrying its own date so the UI can say which day it is
 * from. Nothing cached and nothing fetched → null, and the toggle simply isn't
 * there (rule 11).
 */
import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { fxRate } from "@/db/schema";
import { CURRENCIES } from "@/lib/currency";
import type { Currency } from "@/lib/currency";

/** Multipliers turning a major amount in each currency into the home currency, plus the day they were published. */
export type HomeRates = {
  home: Currency;
  toHome: Record<Currency, number>;
  /** `YYYY-MM-DD` the provider published these on (rule 10). */
  date: string;
  /** True when the fetch failed and this came out of the cache — the UI must say so. */
  stale: boolean;
};

const DAY_SECONDS = 86_400;

export async function getHomeRates(home: Currency): Promise<HomeRates | null> {
  const fetched = await fetchRates(home);
  if (fetched) {
    await cacheRates(home, fetched.date, fetched.perHome);
    return { ...toHomeRates(home, fetched.perHome), date: fetched.date, stale: false };
  }
  return readCachedRates(home);
}

/** Raw provider call — `perHome[c]` is units of `c` per 1 home. Never throws. */
async function fetchRates(
  home: Currency,
): Promise<{ date: string; perHome: Record<string, number> } | null> {
  const symbols = CURRENCIES.filter((c) => c !== home);
  try {
    const url = `https://api.frankfurter.app/latest?base=${home}&symbols=${symbols.join(",")}`;
    const res = await fetch(url, { next: { revalidate: DAY_SECONDS } });
    if (!res.ok) return null;

    const body = (await res.json()) as {
      date?: string;
      rates?: Record<string, number>;
    };
    if (!body.rates || !body.date) return null;
    return { date: body.date, perHome: body.rates };
  } catch {
    return null; // offline / provider down — the cache gets its turn
  }
}

/** Append-only; re-running the same day is a no-op thanks to `fx_rate_quote_idx`. */
async function cacheRates(
  home: Currency,
  date: string,
  perHome: Record<string, number>,
): Promise<void> {
  const rows = CURRENCIES.filter(
    (c) => c !== home && Number.isFinite(perHome[c]) && perHome[c] > 0,
  ).map((c) => ({ date, base: home, currency: c, rate: perHome[c] }));
  if (rows.length === 0) return;

  try {
    await db.insert(fxRate).values(rows).onConflictDoNothing();
  } catch {
    // A cache that can't be written is still a working page (rule 11).
  }
}

/** Newest cached publication for this base, all of it from one day. */
async function readCachedRates(home: Currency): Promise<HomeRates | null> {
  try {
    const latest = await db
      .select({ date: fxRate.date })
      .from(fxRate)
      .where(eq(fxRate.base, home))
      .orderBy(desc(fxRate.date))
      .limit(1)
      .get();
    if (!latest) return null;

    const rows = await db
      .select({ currency: fxRate.currency, rate: fxRate.rate })
      .from(fxRate)
      .where(and(eq(fxRate.base, home), eq(fxRate.date, latest.date)))
      .all();

    const perHome: Record<string, number> = {};
    for (const r of rows) perHome[r.currency] = r.rate;
    return { ...toHomeRates(home, perHome), date: latest.date, stale: true };
  } catch {
    return null;
  }
}

/** Inverts units-of-c-per-home into home-per-unit-of-c. Unquoted currencies stay 0 — `rateFor` reads that as "no rate". */
function toHomeRates(
  home: Currency,
  perHome: Record<string, number>,
): { home: Currency; toHome: Record<Currency, number> } {
  const toHome = Object.fromEntries(CURRENCIES.map((c) => [c, 0])) as Record<
    Currency,
    number
  >;
  toHome[home] = 1;
  for (const c of CURRENCIES) {
    if (c === home) continue;
    const rate = perHome[c];
    if (Number.isFinite(rate) && rate > 0) toHome[c] = 1 / rate;
  }
  return { home, toHome };
}
