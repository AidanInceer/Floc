/**
 * One payment per pair of people (#461). Balances stay per currency (#253); when two people owe each other
 * in more than one, the payer settles the net in their own home currency. Each currency cleared is still its
 * own settlement row, written together, each with the rate it was cleared at — so nothing is ever converted
 * after the fact (rules 1 and 2).
 */
import type { Currency } from "./currency";
import { convertMinor, crossRate } from "./money";
import type { CurrencyTransfer } from "./settle-up";

export type PairPart = {
  fromUserId: string;
  toUserId: string;
  amountMinor: number;
  currency: Currency;
  clearsAmountMinor?: number;
  clearsCurrency?: Currency;
  /** Cleared currency per one paid, as a cross-currency settlement stores it. */
  fxRate?: number;
};

export type PairRow = {
  other: string;
  payer: string;
  payee: string;
  currency: Currency;
  amountMinor: number;
  /** More than one currency went into this figure. */
  netted: boolean;
  parts: PairPart[];
};

type Input = {
  transfers: CurrencyTransfer[];
  viewerId: string;
  homeOf: (userId: string) => Currency;
  /** Units of one shared base currency per one of `currency`; null when there is no rate. */
  rateFor: (currency: Currency) => number | null;
};

const single = (t: CurrencyTransfer, viewerId: string): PairRow => ({
  other: t.from === viewerId ? t.to : t.from,
  payer: t.from,
  payee: t.to,
  currency: t.currency,
  amountMinor: t.amountMinor,
  netted: false,
  parts: [{ fromUserId: t.from, toUserId: t.to, amountMinor: t.amountMinor, currency: t.currency }],
});

function netted(rows: CurrencyTransfer[], viewerId: string, other: string, input: Input): PairRow[] {
  const rated = rows.map((r) => ({ r, base: input.rateFor(r.currency) }));
  if (rated.some((x) => x.base === null)) return rows.map((r) => single(r, viewerId));
  // Why: only the sign is read, to pick who pays; no amount is kept from this sum (rule 1).
  const owedToViewer = rated.reduce((sum, { r, base }) => sum + (r.to === viewerId ? 1 : -1) * r.amountMinor * (base ?? 0), 0);
  const [payer, payee] = owedToViewer > 0 ? [other, viewerId] : [viewerId, other];
  const currency = input.homeOf(payer);

  const parts: PairPart[] = [];
  for (const r of rows) {
    const plain = { fromUserId: r.from, toUserId: r.to, amountMinor: r.amountMinor, currency: r.currency };
    if (r.currency === currency) {
      parts.push(plain);
      continue;
    }
    const rate = crossRate(r.currency, currency, input.rateFor);
    if (rate === null) return rows.map((x) => single(x, viewerId));
    const paid = convertMinor(r.amountMinor, r.currency, currency, rate);
    parts.push({ ...plain, amountMinor: paid, currency, clearsAmountMinor: r.amountMinor, clearsCurrency: r.currency, fxRate: 1 / rate });
  }
  const amountMinor = parts.reduce((sum, p) => sum + (p.fromUserId === payer ? p.amountMinor : -p.amountMinor), 0);
  return [{ other, payer, payee, currency, amountMinor, netted: true, parts }];
}

export function pairSettleUp(input: Input): PairRow[] {
  const byOther = new Map<string, CurrencyTransfer[]>();
  for (const t of input.transfers) {
    if (t.from !== input.viewerId && t.to !== input.viewerId) continue;
    const other = t.from === input.viewerId ? t.to : t.from;
    byOther.set(other, [...(byOther.get(other) ?? []), t]);
  }
  return [...byOther].flatMap(([other, rows]) =>
    rows.length === 1 ? [single(rows[0], input.viewerId)] : netted(rows, input.viewerId, other, input),
  );
}
