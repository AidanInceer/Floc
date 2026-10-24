/**
 * Settle-up for the whole group, across currencies (#463, ADR-030). The books stay per currency (#253); the rate
 * only picks who pays whom. Each payment then clears debts in their own currencies, one settlement row each with
 * the rate it cleared at, so every book reaches exactly zero whatever the rate does later (rules 1 and 2).
 */
import { CURRENCIES, type Currency } from "./currency";
import { convertMinor, suggestSettlements, type Balances } from "./money";

export type SettlePart = {
  fromUserId: string;
  toUserId: string;
  amountMinor: number;
  currency: Currency;
  clearsAmountMinor?: number;
  clearsCurrency?: Currency;
  /** Cleared currency per one paid, as a cross-currency settlement stores it. */
  fxRate?: number;
};

export type SettleRow = {
  payer: string;
  payee: string;
  /** The viewer's home currency, or the debt's own when there is no rate. */
  currency: Currency;
  amountMinor: number;
  /** A rate or a second debt went into the figure, so it is not one debt as it stands. */
  netted: boolean;
  /** What marking it paid records, in the payer's home currency. */
  parts: SettlePart[];
};

export type SettleInput = {
  balances: Balances;
  viewerId: string;
  homeOf: (userId: string) => Currency;
  base: Currency;
  /** Units of `base` per one of `currency`; null when there is no rate. */
  rateFor: (currency: Currency) => number | null;
};

/** One debt cleared in its own currency. */
type Leg = { from: string; to: string; currency: Currency; amountMinor: number };
type Payment = { payer: string; payee: string; legs: Leg[] };
/** The input once every rate it needs is known. */
type Rated = Omit<SettleInput, "rateFor"> & { rate: (currency: Currency) => number };

const perCurrency = (balances: Balances): Leg[] =>
  CURRENCIES.flatMap((currency) => suggestSettlements(balances[currency]).map((s) => ({ ...s, currency })));

/** What `a` hands the other side over these legs, in the base. */
const flowIn = (legs: Leg[], a: string, ctx: Rated): number =>
  legs.reduce((sum, leg) => sum + (leg.from === a ? 1 : -1) * convertMinor(leg.amountMinor, leg.currency, ctx.base, ctx.rate(leg.currency)), 0);

function oriented(legs: Leg[], a: string, b: string, ctx: Rated): Payment {
  return flowIn(legs, a, ctx) >= 0 ? { payer: a, payee: b, legs } : { payer: b, payee: a, legs };
}

function byPair(ctx: Rated): Payment[] {
  const pairs = new Map<string, Leg[]>();
  for (const leg of perCurrency(ctx.balances)) {
    const key = [leg.from, leg.to].sort().join(" ");
    pairs.set(key, [...(pairs.get(key) ?? []), leg]);
  }
  return [...pairs.values()].map((legs) => oriented(legs, legs[0].from, legs[0].to, ctx));
}

/** People in visiting order, each with the one they were reached from. */
function walk(root: string, links: Map<string, string[]>, seen: Set<string>): [string, string | null][] {
  const order: [string, string | null][] = [];
  const stack: [string, string | null][] = [[root, null]];
  seen.add(root);
  for (let at = stack.pop(); at; at = stack.pop()) {
    order.push(at);
    for (const next of links.get(at[0]) ?? []) {
      if (seen.has(next)) continue;
      seen.add(next);
      stack.push([next, at[0]]);
    }
  }
  return order;
}

function netInBase(ctx: Rated): Record<string, number> {
  const net: Record<string, number> = {};
  for (const currency of CURRENCIES) {
    for (const [person, amount] of Object.entries(ctx.balances[currency])) {
      net[person] = (net[person] ?? 0) + convertMinor(amount, currency, ctx.base, ctx.rate(currency));
    }
  }
  return net;
}

/** Each person's payment towards the one they were reached from: what squares everyone below them, currency by currency. */
function clearTree(order: [string, string | null][], ctx: Rated): Payment[] | null {
  const held = new Map(order.map(([person]) => [person, CURRENCIES.map((c) => ctx.balances[c][person] ?? 0)]));
  const payments: Payment[] = [];
  for (const [person, from] of [...order].reverse()) {
    const own = held.get(person) ?? [];
    if (from === null) return own.every((left) => left === 0) ? payments : null;
    const up = held.get(from) ?? [];
    const legs: Leg[] = [];
    own.forEach((amount, i) => {
      if (amount === 0) return;
      const currency = CURRENCIES[i];
      legs.push(amount < 0 ? { from: person, to: from, currency, amountMinor: -amount } : { from, to: person, currency, amountMinor: amount });
      up[i] += amount;
    });
    if (legs.length > 0) payments.push(oriented(legs, person, from, ctx));
  }
  return payments;
}

/** Fewest payments on the converted balances, each cleared in its own currencies. Null when a group of them cannot square a currency. */
function converted(ctx: Rated): Payment[] | null {
  const net = netInBase(ctx);
  const links = new Map<string, string[]>();
  for (const s of suggestSettlements(net)) {
    links.set(s.from, [...(links.get(s.from) ?? []), s.to]);
    links.set(s.to, [...(links.get(s.to) ?? []), s.from]);
  }
  const seen = new Set<string>();
  const payments: Payment[] = [];
  for (const root of Object.keys(net)) {
    if (seen.has(root)) continue;
    const tree = clearTree(walk(root, links, seen), ctx);
    if (tree === null) return null;
    payments.push(...tree);
  }
  return payments;
}

const moved = (plan: Payment[], ctx: Rated): number => plan.reduce((sum, p) => sum + Math.abs(flowIn(p.legs, p.payer, ctx)), 0);

function partIn(leg: Leg, pay: Currency, ctx: Rated): SettlePart {
  const plain = { fromUserId: leg.from, toUserId: leg.to, amountMinor: leg.amountMinor, currency: leg.currency };
  if (leg.currency === pay) return plain;
  const rate = ctx.rate(leg.currency) / ctx.rate(pay);
  return { ...plain, amountMinor: convertMinor(leg.amountMinor, leg.currency, pay, rate), currency: pay, clearsAmountMinor: leg.amountMinor, clearsCurrency: leg.currency, fxRate: 1 / rate };
}

function rowOf(payment: Payment, ctx: Rated): SettleRow {
  const { payer, payee } = payment;
  const pay = ctx.homeOf(payer);
  const parts = payment.legs
    .map((leg) => partIn(leg, pay, ctx))
    .sort((a, b) => Number(b.fromUserId === payer) - Number(a.fromUserId === payer));
  const paid = paidIn({ payer, payee, currency: pay, amountMinor: 0, netted: false, parts }).amountMinor;
  const home = ctx.homeOf(ctx.viewerId);
  const amountMinor = home === pay ? paid : convertMinor(paid, pay, home, ctx.rate(pay) / ctx.rate(home));
  const netted = parts.length > 1 || parts.some((p) => p.clearsCurrency) || home !== pay;
  return { payer, payee, currency: home, amountMinor, netted, parts };
}

/** What the payer hands over, in their own currency: the same whoever is looking. */
export function paidIn(row: SettleRow): { currency: Currency; amountMinor: number } {
  const amountMinor = row.parts.reduce((sum, p) => sum + (p.fromUserId === row.payer ? p.amountMinor : -p.amountMinor), 0);
  return { currency: row.parts[0].currency, amountMinor };
}

const unrated = (leg: Leg): SettleRow => ({
  payer: leg.from,
  payee: leg.to,
  currency: leg.currency,
  amountMinor: leg.amountMinor,
  netted: false,
  parts: [{ fromUserId: leg.from, toUserId: leg.to, amountMinor: leg.amountMinor, currency: leg.currency }],
});

const largest = (a: SettleRow, b: SettleRow) => b.amountMinor - a.amountMinor;

function hasRates(input: SettleInput): boolean {
  const people = CURRENCIES.flatMap((c) => Object.keys(input.balances[c]));
  const needed = new Set<Currency>([input.homeOf(input.viewerId), ...people.map(input.homeOf)]);
  for (const c of CURRENCIES) if (Object.values(input.balances[c]).some((v) => v !== 0)) needed.add(c);
  return [...needed].every((c) => input.rateFor(c) !== null);
}

/** Every payment that squares the group, largest first; the viewer's own are among them. */
export function groupSettleUp(input: SettleInput): SettleRow[] {
  // Rule 11: without a rate the honest answer is each currency's own payments.
  if (!hasRates(input)) return perCurrency(input.balances).map(unrated).sort(largest);
  const ctx: Rated = { ...input, rate: (currency) => input.rateFor(currency) ?? 0 };
  const plans = [converted(ctx), byPair(ctx)].filter((p): p is Payment[] => p !== null);
  plans.sort((a, b) => a.length - b.length || moved(a, ctx) - moved(b, ctx));
  return plans[0].map((p) => rowOf(p, ctx)).sort(largest);
}
