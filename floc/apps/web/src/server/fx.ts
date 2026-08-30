/**
 * Display-only FX (money overhaul). The ledger is always stored in the
 * currency an expense or settlement was recorded in — this only powers the
 * convert toggle that previews an amount in the viewer's home currency. Never
 * feeds a write. Free daily rates from frankfurter.app (no key); on any
 * failure it returns null and the convert control simply hides (rule 11).
 */
import "server-only";

import { CURRENCIES } from "@/lib/currency";
import type { Currency } from "@/lib/currency";

/** Multipliers turning a minor amount in each currency into the home currency. */
export type HomeRates = { home: Currency; toHome: Record<Currency, number> };

const DAY_SECONDS = 86_400;

export async function getHomeRates(home: Currency): Promise<HomeRates | null> {
  const symbols = CURRENCIES.filter((c) => c !== home);
  if (symbols.length === 0) {
    return { home, toHome: identity(home) };
  }

  try {
    const url = `https://api.frankfurter.app/latest?base=${home}&symbols=${symbols.join(",")}`;
    const res = await fetch(url, { next: { revalidate: DAY_SECONDS } });
    if (!res.ok) return null;

    const body = (await res.json()) as { rates?: Record<string, number> };
    const rates = body.rates;
    if (!rates) return null;

    const toHome = identity(home);
    for (const c of symbols) {
      const perHome = rates[c]; // units of c per 1 home
      if (!Number.isFinite(perHome) || perHome <= 0) return null;
      toHome[c] = 1 / perHome; // home per 1 c
    }
    return { home, toHome };
  } catch {
    return null; // offline / provider down — button hides, real amounts stay
  }
}

function identity(home: Currency): Record<Currency, number> {
  const map = Object.fromEntries(CURRENCIES.map((c) => [c, 0])) as Record<
    Currency,
    number
  >;
  map[home] = 1;
  return map;
}
