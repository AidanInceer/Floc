/**
 * Exchange rates (money overhaul; cached by ticket 253). The ledger is always
 * stored in the currency an expense or settlement was recorded in. These rates
 * back the totals toggle, the settle-up payments (#463) and the pre-fill of a
 * cross-currency settle-up, which snapshots its own rate onto the settlement row.
 *
 * Free daily rates from frankfurter.app (no key), always asked from the euro and
 * held as one quote for an hour, so every page converts at the same rate.
 * Successful fetches are written to `fx_rate`; when the provider is down the
 * newest cached quote is served instead, carrying its own date so the UI can say
 * which day it is from. Nothing cached and nothing fetched → null, and the
 * toggle simply isn't there (rule 11).
 */
import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { fxRate } from "@/db/schema";
import { CURRENCIES } from "@floc/core/money/currency";
import type { Currency } from "@floc/core/money/currency";

/** Multipliers turning a major amount in each currency into the home currency, plus the day they were published. */
export type HomeRates = {
  home: Currency;
  toHome: Record<Currency, number>;
  /** `YYYY-MM-DD` the provider published these on (rule 10). */
  date: string;
  /** True when the fetch failed and this came out of the cache — the UI must say so. */
  stale: boolean;
};

type Quote = { date: string; perEur: Record<string, number>; stale: boolean };

// Why: frankfurter quotes every rate from the euro, so one stored quote answers every home currency.
const BASE: Currency = "EUR";
const RECHECK_MS = 60 * 60 * 1000;

// Why: one quote per hour for every page, so Overview and Money never convert at two days' rates.
let memo: { at: number; quote: Promise<Quote | null> } | null = null;

export async function getHomeRates(home: Currency): Promise<HomeRates | null> {
  const quote = await quoteOfRecord();
  if (!quote) return null;
  const toHome = crossRates(home, quote.perEur);
  return toHome && { home, toHome, date: quote.date, stale: quote.stale };
}

export function clearRatesMemo(): void {
  memo = null;
}

function quoteOfRecord(): Promise<Quote | null> {
  if (!memo || Date.now() - memo.at >= RECHECK_MS) memo = { at: Date.now(), quote: freshQuote() };
  return memo.quote;
}

async function freshQuote(): Promise<Quote | null> {
  const fetched = await fetchRates();
  if (!fetched) return readCachedRates();
  await cacheRates(fetched.date, fetched.perEur);
  return { ...fetched, stale: false };
}

/** Raw provider call — `perEur[c]` is units of `c` per 1 euro. Never throws. */
async function fetchRates(): Promise<{ date: string; perEur: Record<string, number> } | null> {
  const symbols = CURRENCIES.filter((c) => c !== BASE);
  try {
    const url = `https://api.frankfurter.app/latest?base=${BASE}&symbols=${symbols.join(",")}`;
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(5_000) });
    if (!res.ok) return null;

    const body = (await res.json()) as {
      date?: string;
      rates?: Record<string, number>;
    };
    if (!body.rates || !body.date) return null;
    return { date: body.date, perEur: body.rates };
  } catch {
    return null; // offline / provider down — the cache gets its turn
  }
}

/** Append-only; re-running the same day is a no-op thanks to `fx_rate_quote_idx`. */
async function cacheRates(date: string, perEur: Record<string, number>): Promise<void> {
  const rows = CURRENCIES.filter(
    (c) => c !== BASE && Number.isFinite(perEur[c]) && perEur[c] > 0,
  ).map((c) => ({ date, base: BASE, currency: c, rate: perEur[c] }));
  if (rows.length === 0) return;

  try {
    // Why read first: a day's rates are written once, and every page view asks.
    const known = await db
      .select({ id: fxRate.id })
      .from(fxRate)
      .where(and(eq(fxRate.base, BASE), eq(fxRate.date, date)))
      .limit(1)
      .get();
    if (known) return;
    await db.insert(fxRate).values(rows).onConflictDoNothing();
  } catch {
    // A cache that can't be written is still a working page (rule 11).
  }
}

/** Newest cached euro publication, all of it from one day. */
async function readCachedRates(): Promise<Quote | null> {
  try {
    const latest = await db
      .select({ date: fxRate.date })
      .from(fxRate)
      .where(eq(fxRate.base, BASE))
      .orderBy(desc(fxRate.date))
      .limit(1)
      .get();
    if (!latest) return null;

    const rows = await db
      .select({ currency: fxRate.currency, rate: fxRate.rate })
      .from(fxRate)
      .where(and(eq(fxRate.base, BASE), eq(fxRate.date, latest.date)))
      .all();

    const perEur: Record<string, number> = {};
    for (const r of rows) perEur[r.currency] = r.rate;
    return { date: latest.date, perEur, stale: true };
  } catch {
    return null;
  }
}

/** Home per unit of each currency, through the euro. Unquoted currencies stay 0 — `rateFor` reads that as "no rate". */
function crossRates(home: Currency, perEur: Record<string, number>): Record<Currency, number> | null {
  const usable = (c: Currency): number | null => {
    if (c === BASE) return 1;
    const rate = perEur[c];
    return Number.isFinite(rate) && rate > 0 ? rate : null;
  };
  const homePerEur = usable(home);
  if (homePerEur === null) return null;
  const toHome = Object.fromEntries(CURRENCIES.map((c) => [c, 0])) as Record<Currency, number>;
  for (const c of CURRENCIES) {
    const rate = usable(c);
    if (rate !== null) toHome[c] = homePerEur / rate;
  }
  toHome[home] = 1;
  return toHome;
}
