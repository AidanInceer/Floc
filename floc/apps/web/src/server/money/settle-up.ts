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

const BASE: Currency = "EUR";

export async function settleUpFor(tripId: number, viewerId: string): Promise<SettleUp> {
  const [expenses, splits, settlements] = await Promise.all([listExpenses(tripId), listSplits(tripId), listSettlements(tripId)]);
  return settleUpFrom({ ledger: { expenses, splits, settlements }, viewerId });
}

async function homesOf(people: string[], given?: Map<string, Currency>): Promise<Map<string, Currency>> {
  const missing = people.filter((id) => !given?.has(id));
  if (missing.length === 0 && given) return given;
  return new Map([...(given ?? []), ...(await homeCurrenciesFor(missing))]);
}

export async function settleUpFrom({ ledger, viewerId, homes: given }: { ledger: Ledger; viewerId: string; homes?: Map<string, Currency> }): Promise<SettleUp> {
  const balances = ledgerBalances(ledger);
  const people = [...new Set([viewerId, ...CURRENCIES.flatMap((c) => Object.keys(balances[c]))])];
  const homes = await homesOf(people, given);
  const homeOf = (id: string): Currency => homes.get(id) ?? "GBP";
  const used = new Set([...people.map(homeOf), ...CURRENCIES.filter((c) => Object.values(balances[c]).some((v) => v !== 0))]);
  const one = used.size === 1 ? [...used][0] : null;
  const rates = one ? null : await getHomeRates(BASE);
  const base = one ?? BASE;
  const rateFor = (c: Currency): number | null => (c === base ? 1 : rates?.toHome[c] || null);
  return {
    rows: groupSettleUp({ balances, viewerId, homeOf, base, rateFor }),
    rateDate: rates?.date ?? null,
  };
}

export async function settleWithFor(access: Access, otherUserId: string): Promise<Refusal | null> {
  const { rows, rateDate } = await settleUpFor(access.trip.id, access.viewer.id);
  const viewerId = access.viewer.id;
  const row = rows.find((r) => (r.payer === viewerId && r.payee === otherUserId) || (r.payee === viewerId && r.payer === otherUserId));
  if (!row) return new Refusal("Nothing to settle with them.", "invalid");
  return recordTransfers(access, row.parts.map((p) => ({ ...p, ...(p.fxRate ? { fxRateDate: rateDate } : {}) })));
}
