import "server-only";

import { CURRENCIES, type Currency } from "@floc/core/money/currency";
import { ledgerBalances } from "@floc/core/money/ledger";
import { suggestSettlements } from "@floc/core/money/money";
import { pairSettleUp, type PairRow } from "@floc/core/money/pair-settle";
import { getProfile, homeCurrenciesFor } from "@/server/auth/profile";
import { getHomeRates, type HomeRates } from "./fx";
import { listExpenses, listSettlements, listSplits } from "./money";
import { recordTransfers } from "./money-save";
import { Refusal } from "@floc/core/errors/refusal";
import type { TripAccess as Access } from "@/server/access";

export type PairSettleUp = { rows: PairRow[]; rateDate: string | null };

type Ledger = Parameters<typeof ledgerBalances>[0];

/** The viewer's settle-up, one row per person (#461), read fresh — the action recomputes rather than trusting the form. */
export async function pairSettleUpFor(tripId: number, viewerId: string): Promise<PairSettleUp> {
  const [expenses, splits, settlements, profile] = await Promise.all([
    listExpenses(tripId),
    listSplits(tripId),
    listSettlements(tripId),
    getProfile(viewerId),
  ]);
  return pairSettleUpFrom({ ledger: { expenses, splits, settlements }, viewerId, base: profile?.homeCurrency ?? "GBP" });
}

/** The same, from a ledger the caller already holds; `rates` skips the fetch when the caller has them. */
export async function pairSettleUpFrom(args: { ledger: Ledger; viewerId: string; base: Currency; rates?: HomeRates | null }): Promise<PairSettleUp> {
  const { viewerId, base } = args;
  const balances = ledgerBalances(args.ledger);
  const transfers = CURRENCIES.flatMap((currency) => suggestSettlements(balances[currency]).map((s) => ({ ...s, currency })));
  const mine = transfers.filter((t) => t.from === viewerId || t.to === viewerId);
  // Why: the rates call can take seconds; a single currency needs none.
  const mixed = new Set(mine.map((t) => t.currency)).size > 1;
  const [homes, rates] = await Promise.all([
    homeCurrenciesFor([...new Set(mine.flatMap((t) => [t.from, t.to]))]),
    args.rates !== undefined || !mixed ? Promise.resolve(args.rates ?? null) : getHomeRates(base),
  ]);
  const rateFor = (c: Currency): number | null => (c === base ? 1 : rates?.toHome[c] || null);
  return {
    rows: pairSettleUp({ transfers: mine, viewerId, homeOf: (id) => homes.get(id) ?? "GBP", rateFor }),
    rateDate: rates?.date ?? null,
  };
}

/** Records the one payment between the viewer and one person (#461), recomputed now; web and phone both call this. */
export async function settlePairFor(access: Access, otherUserId: string): Promise<Refusal | null> {
  const { rows, rateDate } = await pairSettleUpFor(access.trip.id, access.viewer.id);
  const parts = rows.filter((r) => r.other === otherUserId).flatMap((r) => r.parts);
  if (parts.length === 0) return new Refusal("Nothing to settle with them.", "invalid");
  return recordTransfers(access, parts.map((p) => ({ ...p, ...(p.fxRate ? { fxRateDate: rateDate } : {}) })));
}
