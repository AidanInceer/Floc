import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { fxRate } from "@/db/schema";
import { CURRENCIES } from "@floc/core/money/currency";
import type { Currency } from "@floc/core/money/currency";

export type HomeRates = {
  home: Currency;
  toHome: Record<Currency, number>;
  date: string;
  stale: boolean;
};

type Quote = { date: string; perEur: Record<string, number>; stale: boolean };

const BASE: Currency = "EUR";
const RECHECK_MS = 60 * 60 * 1000;

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
    return null;
  }
}

async function cacheRates(date: string, perEur: Record<string, number>): Promise<void> {
  const rows = CURRENCIES.filter(
    (c) => c !== BASE && Number.isFinite(perEur[c]) && perEur[c] > 0,
  ).map((c) => ({ date, base: BASE, currency: c, rate: perEur[c] }));
  if (rows.length === 0) return;

  try {
    const known = await db
      .select({ id: fxRate.id })
      .from(fxRate)
      .where(and(eq(fxRate.base, BASE), eq(fxRate.date, date)))
      .limit(1)
      .get();
    if (known) return;
    await db.insert(fxRate).values(rows).onConflictDoNothing();
  } catch {
  }
}

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
