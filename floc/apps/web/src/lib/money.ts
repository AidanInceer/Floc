/**
 * Money is never a float; every amount is an integer minor-unit count.
 * Exact-sum invariant is enforced here, not in the schema (issue 04).
 */
import {
  CURRENCIES,
  currencySymbol,
  minorPerMajor,
  minorUnitExponent,
  type Currency,
} from "@/lib/currency";
import type { SplitType } from "@/db/schema";

/** Ceiling of £1bn in minor units — past MAX_SAFE_INTEGER, every later read throws and locks the trip out (ticket 33). */
const MAX_AMOUNT_MINOR = 100_000_000_000;

/** A single expense (or a pinned share) can't exceed 1,000,000 major units — a friendly cap well under the arithmetic ceiling. */
export function maxExpenseMinor(currency: Currency): number {
  return 1_000_000 * minorPerMajor(currency);
}

function assertInRange(amountMinor: number): void {
  if (!Number.isFinite(amountMinor) || Math.abs(amountMinor) > MAX_AMOUNT_MINOR) {
    throw new Error("That amount is too large — keep it under a billion.");
  }
}

/** Digits only, no symbol or code — "12.34", "5600". The shared half of both formatters. */
function decimalString(amountMinor: number, currency: Currency): string {
  const exponent = minorUnitExponent(currency);
  const per = minorPerMajor(currency);
  const abs = Math.abs(amountMinor);
  const major = Math.floor(abs / per).toLocaleString("en-GB");
  if (exponent === 0) return major;
  return `${major}.${String(abs % per).padStart(exponent, "0")}`;
}

/** "£47.50", "JPY 5600" — symbol where one names this currency alone, ISO code where it doesn't (ticket 253). */
export function formatMoney(amountMinor: number, currency: Currency): string {
  const symbol = currencySymbol(currency);
  const digits = decimalString(amountMinor, currency);
  const body = symbol ? `${symbol}${digits}` : `${currency} ${digits}`;
  return amountMinor < 0 ? `−${body}` : body;
}

/** ISO-ticker form — "GBP 12.34", "JPY 5600" — for the convert control, where the code, not a symbol, is the point. */
export function formatTicker(amountMinor: number, currency: Currency): string {
  const body = `${currency} ${decimalString(amountMinor, currency)}`;
  return amountMinor < 0 ? `−${body}` : body;
}

/** Minor units → the bare decimal a form box edits — "12.34", "5600". No grouping, no symbol. */
export function toMajorInput(amountMinor: number, currency: Currency): string {
  return (amountMinor / minorPerMajor(currency)).toFixed(minorUnitExponent(currency));
}

/** Keeps a money box to digits and at most this currency's decimal places. */
export function sanitizeAmountInput(raw: string, currency: Currency): string {
  const exponent = minorUnitExponent(currency);
  const cleaned = raw.replace(/[^\d.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  if (exponent === 0) return whole;
  return rest.length ? `${whole}.${rest.join("").slice(0, exponent)}` : whole;
}

/**
 * Parses "12.34", "12", "£12.34" into minor units. Throws on nonsense —
 * including more decimal places than the currency has, so "5600.00" is a
 * rejection for JPY rather than a hundredfold error (ticket 253).
 */
export function parseMoney(input: string, currency: Currency): number {
  const exponent = minorUnitExponent(currency);
  const cleaned = input.replace(/[^\d.-]/g, "");
  const shape =
    exponent === 0 ? /^-?\d+$/ : new RegExp(`^-?\\d+(\\.\\d{1,${exponent}})?$`);
  if (!shape.test(cleaned)) {
    throw new Error(`Not a valid amount: ${input}`);
  }
  const negative = cleaned.startsWith("-");
  const [major, minor = ""] = cleaned.replace("-", "").split(".");
  const total =
    Number(major) * minorPerMajor(currency) +
    (exponent === 0 ? 0 : Number(minor.padEnd(exponent, "0") || 0));
  assertInRange(total);
  return negative ? -total : total;
}

export type SplitInput = {
  userId: string;
  /** Meaning depends on split type: unused / minor units / percent / shares. */
  value?: number;
};

export type SplitResult = { userId: string; owedAmountMinor: number };

/**
 * Split types still *writable* (ticket 117, S12). `even`/`percentage` remain
 * readable (immutable snapshots, non-negotiable 2) but only these two are
 * produced since the shares model (ticket 85).
 */
export type WritableSplitType = Extract<SplitType, "shares" | "exact">;

/** Split type + participants → snapshot rows summing to exactly `amountMinor`. */
export function computeSplits(
  amountMinor: number,
  splitType: WritableSplitType,
  participants: SplitInput[],
): SplitResult[] {
  if (participants.length === 0) {
    throw new Error("An expense needs at least one participant");
  }
  if (!Number.isInteger(amountMinor)) {
    throw new Error("amountMinor must be an integer number of minor units");
  }
  assertInRange(amountMinor);

  switch (splitType) {
    case "exact": {
      const rows = participants.map((p) => ({
        userId: p.userId,
        owedAmountMinor: Math.round(p.value ?? 0),
      }));
      const sum = rows.reduce((a, r) => a + r.owedAmountMinor, 0);
      if (sum !== amountMinor) {
        throw new Error(
          `Exact splits must sum to the total: got ${sum}, expected ${amountMinor}`,
        );
      }
      return rows;
    }

    case "shares": {
      const weights = participants.map((p) => p.value ?? 0);
      if (weights.some((w) => w < 0) || weights.every((w) => w === 0)) {
        throw new Error("Shares must be non-negative with at least one > 0");
      }
      return distribute(amountMinor, weights, participants);
    }
  }
}

/**
 * Weighted allocation of an integer total. Floors each share, then hands the
 * remainder out a penny at a time to the largest fractional parts (ties broken
 * by participant order) so the result is stable and sums exactly.
 */
function distribute(
  amountMinor: number,
  weights: number[],
  participants: SplitInput[],
): SplitResult[] {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  if (totalWeight <= 0) throw new Error("Split weights must total more than 0");

  const sign = amountMinor < 0 ? -1 : 1;
  const abs = Math.abs(amountMinor);

  const exact = weights.map((w) => (abs * w) / totalWeight);
  const floors = exact.map(Math.floor);
  let remainder = abs - floors.reduce((a, b) => a + b, 0);

  const order = exact
    .map((value, i) => ({ i, frac: value - floors[i] }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);

  const amounts = [...floors];
  for (const { i } of order) {
    if (remainder <= 0) break;
    amounts[i] += 1;
    remainder -= 1;
  }

  return participants.map((p, i) => ({
    userId: p.userId,
    owedAmountMinor: sign * amounts[i],
  }));
}

export type WeightedInput = {
  userId: string;
  /** Shares of whatever is left this person carries. */
  shares: number;
  /** Fixed amount in minor units — "Ravi owes exactly £30" — or null. */
  pinnedMinor: number | null;
};

/** Shares + optional pins (ticket 85) → stored vocabulary: nothing pinned → `shares`, anything pinned → `exact`. */
export function resolveWeightedSplit(
  amountMinor: number,
  rows: WeightedInput[],
  currency: Currency,
): { splitType: WritableSplitType; participants: SplitInput[] } {
  if (rows.length === 0) {
    throw new Error("An expense needs at least one person in it.");
  }
  if (rows.some((r) => !Number.isFinite(r.shares) || r.shares < 0)) {
    throw new Error("Shares can't be negative.");
  }

  const pinned = rows.filter((r) => r.pinnedMinor !== null);
  if (pinned.length === 0) {
    return {
      splitType: "shares",
      participants: rows.map((r) => ({ userId: r.userId, value: r.shares })),
    };
  }

  const pinnedTotal = pinned.reduce((sum, r) => sum + (r.pinnedMinor ?? 0), 0);
  const remainder = amountMinor - pinnedTotal;
  if (remainder < 0) {
    throw new Error(
      `The pinned amounts already come to ${formatMoney(pinnedTotal, currency)}, which is more than the total.`,
    );
  }

  const unpinned = rows.filter((r) => r.pinnedMinor === null);
  const shareTotal = unpinned.reduce((sum, r) => sum + r.shares, 0);
  if (remainder > 0 && shareTotal === 0) {
    throw new Error(
      `${formatMoney(remainder, currency)} is left over and nobody's on shares to absorb it.`,
    );
  }

  const rest =
    remainder > 0
      ? new Map(
          computeSplits(
            remainder,
            "shares",
            unpinned.map((r) => ({ userId: r.userId, value: r.shares })),
          ).map((s) => [s.userId, s.owedAmountMinor]),
        )
      : new Map<string, number>();

  return {
    splitType: "exact",
    participants: rows.map((r) => ({
      userId: r.userId,
      value: r.pinnedMinor ?? rest.get(r.userId) ?? 0,
    })),
  };
}

// Balances — derived at read time, never stored (ticket 04). An expense is
// what a bill implies about who owes who; a settlement is real money that has
// since moved. The net of the two is the live position, and either can be
// soft-deleted to undo it (money overhaul).
export type LedgerLine = {
  paidBy: string;
  currency: Currency;
  amountMinor: number;
  splits: { userId: string; owedAmountMinor: number }[];
};

/**
 * A recorded transfer that has already happened off-app. When the money left
 * the payer's pocket in one currency and cleared a debt in another, `clears*`
 * carry the debt side and the balance moves there — the amount actually handed
 * over is a record of the payment, never a rate to reuse (ticket 253).
 */
export type LedgerSettlement = {
  from: string;
  to: string;
  currency: Currency;
  amountMinor: number;
  clearsCurrency?: Currency | null;
  clearsAmountMinor?: number | null;
};

/**
 * Per-currency net position for each member: positive = owed money back,
 * negative = owes (or, after an underlying expense is deleted, has *overpaid*).
 */
export type Balances = Record<Currency, Record<string, number>>;

export function computeBalances(
  lines: LedgerLine[],
  settlements: LedgerSettlement[] = [],
): Balances {
  // Derived from CURRENCIES, not a literal — drifted silently to undefined on a 4th currency before (ticket 115).
  const balances = Object.fromEntries(
    CURRENCIES.map((c) => [c, {} as Record<string, number>]),
  ) as Balances;

  for (const line of lines) {
    const book = balances[line.currency];
    for (const split of line.splits) {
      if (split.userId === line.paidBy) continue;
      book[split.userId] = (book[split.userId] ?? 0) - split.owedAmountMinor;
      book[line.paidBy] = (book[line.paidBy] ?? 0) + split.owedAmountMinor;
    }
  }

  // A paid B: B's debt drops (B moves up), A is owed that much less (A down).
  for (const s of settlements) {
    const currency = s.clearsCurrency ?? s.currency;
    const amountMinor = s.clearsAmountMinor ?? s.amountMinor;
    const book = balances[currency];
    book[s.from] = (book[s.from] ?? 0) + amountMinor;
    book[s.to] = (book[s.to] ?? 0) - amountMinor;
  }

  return balances;
}

/** True when nobody owes anybody, in any currency — the "trip settled up" state. */
export function isAllSettled(balances: Balances): boolean {
  return CURRENCIES.every((c) =>
    Object.values(balances[c]).every((amount) => amount === 0),
  );
}

export type Settlement = { from: string; to: string; amountMinor: number };

/**
 * Greedy settle-up: match the biggest debtor to the biggest creditor until
 * everyone is square. Minimises the number of transfers well enough for a
 * group of friends, and is a suggestion only — v1 moves no money.
 */
export function suggestSettlements(
  book: Record<string, number>,
): Settlement[] {
  const debtors = Object.entries(book)
    .filter(([, v]) => v < 0)
    .map(([userId, v]) => ({ userId, amount: -v }))
    .sort((a, b) => b.amount - a.amount);
  const creditors = Object.entries(book)
    .filter(([, v]) => v > 0)
    .map(([userId, v]) => ({ userId, amount: v }))
    .sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let d = 0;
  let c = 0;
  while (d < debtors.length && c < creditors.length) {
    const amount = Math.min(debtors[d].amount, creditors[c].amount);
    if (amount > 0) {
      settlements.push({
        from: debtors[d].userId,
        to: creditors[c].userId,
        amountMinor: amount,
      });
    }
    debtors[d].amount -= amount;
    creditors[c].amount -= amount;
    if (debtors[d].amount === 0) d += 1;
    if (creditors[c].amount === 0) c += 1;
  }
  return settlements;
}

/**
 * Display-only sum of one member's books in a single currency (ticket 253).
 * Each row is converted and rounded on its own, then the rounded rows are
 * added — so the figure always matches the rows printed beside it, at the cost
 * of a possible minor unit of drift from a directly-converted total. That is
 * what the `≈` is for. Nothing here is ever stored.
 */
export function convertTotal(
  perCurrency: { currency: Currency; amountMinor: number }[],
  home: Currency,
  rateFor: (currency: Currency) => number | null,
): number | null {
  let total = 0;
  for (const row of perCurrency) {
    if (row.currency === home) {
      total += row.amountMinor;
      continue;
    }
    const rate = rateFor(row.currency);
    if (rate === null) return null; // one missing rate makes the whole total a lie
    total += convertMinor(row.amountMinor, row.currency, home, rate);
  }
  return total;
}

/** Cross rate between two currencies quoted against the same base — `to` per 1 `from`. */
export function crossRate(
  from: Currency,
  to: Currency,
  rateFor: (currency: Currency) => number | null,
): number | null {
  if (from === to) return 1;
  const fromRate = rateFor(from);
  const toRate = rateFor(to);
  if (!fromRate || !toRate) return null;
  return fromRate / toRate;
}

/** Applies a `to`-per-`from` rate to a minor amount, honouring both exponents. */
export function convertMinor(
  amountMinor: number,
  from: Currency,
  to: Currency,
  rate: number,
): number {
  return Math.round(
    amountMinor * rate * (minorPerMajor(to) / minorPerMajor(from)),
  );
}
