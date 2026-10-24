import "server-only";

import { CURRENCIES, type Currency } from "@floc/core/money/currency";
import { groupSettleUp, type SettleRow } from "@floc/core/money/group-settle";
import { ledgerBalances } from "@floc/core/money/ledger";
import { Refusal } from "@floc/core/errors/refusal";
import { homeCurrenciesFor } from "@/server/auth/profile";
import { getHomeRates } from "./fx";
import { listExpenses, listSettlements, listSplits } from "./money";
import { recordTransfers } from "./money-save";
import type { TripAccess as Access } from "@/server/access";

export type SettleUp = { rows: SettleRow[]; rateDate: string | null };

type Ledger = Parameters<typeof ledgerBalances>[0];

// Why: frankfurter quotes every rate from the euro, and one base for every viewer keeps the payments the same whoever looks (#463).
const BASE: Currency = "EUR";

/** The group's settle-up as the viewer sees it, read fresh — the action recomputes rather than trusting the form. */
export async function settleUpFor(tripId: number, viewerId: string): Promise<SettleUp> {
  const [expenses, splits, settlements] = await Promise.all([listExpenses(tripId), listSplits(tripId), listSettlements(tripId)]);
  return settleUpFrom({ ledger: { expenses, splits, settlements }, viewerId });
}

/** The same, from a ledger the caller already holds. */
export async function settleUpFrom({ ledger, viewerId }: { ledger: Ledger; viewerId: string }): Promise<SettleUp> {
  const balances = ledgerBalances(ledger);
  const people = [...new Set([viewerId, ...CURRENCIES.flatMap((c) => Object.keys(balances[c]))])];
  const homes = await homeCurrenciesFor(people);
  const homeOf = (id: string): Currency => homes.get(id) ?? "GBP";
  const used = new Set([...people.map(homeOf), ...CURRENCIES.filter((c) => Object.values(balances[c]).some((v) => v !== 0))]);
  // Why: the rates call can take seconds; one currency for everyone needs none.
  const one = used.size === 1 ? [...used][0] : null;
  const rates = one ? null : await getHomeRates(BASE);
  const base = one ?? BASE;
  const rateFor = (c: Currency): number | null => (c === base ? 1 : rates?.toHome[c] || null);
  return {
    rows: groupSettleUp({ balances, viewerId, homeOf, base, rateFor }),
    rateDate: rates?.date ?? null,
  };
}

/** Records the one payment between the viewer and one person (#463), recomputed now; web and phone both call this. */
export async function settleWithFor(access: Access, otherUserId: string): Promise<Refusal | null> {
  const { rows, rateDate } = await settleUpFor(access.trip.id, access.viewer.id);
  const viewerId = access.viewer.id;
  const row = rows.find((r) => (r.payer === viewerId && r.payee === otherUserId) || (r.payee === viewerId && r.payer === otherUserId));
  if (!row) return new Refusal("Nothing to settle with them.", "invalid");
  return recordTransfers(access, row.parts.map((p) => ({ ...p, ...(p.fxRate ? { fxRateDate: rateDate } : {}) })));
}
