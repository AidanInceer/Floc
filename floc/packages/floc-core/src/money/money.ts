import {
  CURRENCIES,
  currencySymbol,
  minorPerMajor,
  minorUnitExponent,
  type Currency,
} from "./currency";
import type { SplitType } from "../vocabulary";

const MAX_AMOUNT_MINOR = 100_000_000_000;

export function maxExpenseMinor(currency: Currency): number {
  return 1_000_000 * minorPerMajor(currency);
}

function assertInRange(amountMinor: number): void {
  if (!Number.isFinite(amountMinor) || Math.abs(amountMinor) > MAX_AMOUNT_MINOR) {
    throw new Error("That amount is too large — keep it under a billion.");
  }
}

function decimalString(amountMinor: number, currency: Currency): string {
  const exponent = minorUnitExponent(currency);
  const per = minorPerMajor(currency);
  const abs = Math.abs(amountMinor);
  const major = Math.floor(abs / per).toLocaleString("en-GB");
  if (exponent === 0) return major;
  return `${major}.${String(abs % per).padStart(exponent, "0")}`;
}

export function formatMoney(amountMinor: number, currency: Currency): string {
  const symbol = currencySymbol(currency);
  const digits = decimalString(amountMinor, currency);
  const body = symbol ? `${symbol}${digits}` : `${currency} ${digits}`;
  return amountMinor < 0 ? `−${body}` : body;
}

export function toMajorInput(amountMinor: number, currency: Currency): string {
  return (amountMinor / minorPerMajor(currency)).toFixed(minorUnitExponent(currency));
}

export function sanitizeAmountInput(raw: string, currency: Currency): string {
  const exponent = minorUnitExponent(currency);
  const cleaned = raw.replace(/[^\d.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  if (exponent === 0) return whole;
  return rest.length ? `${whole}.${rest.join("").slice(0, exponent)}` : whole;
}

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
  value?: number;
};

export type SplitResult = { userId: string; owedAmountMinor: number };

export const WRITABLE_SPLIT_TYPES = [
  "shares",
  "exact",
] as const satisfies readonly SplitType[];

export type WritableSplitType = (typeof WRITABLE_SPLIT_TYPES)[number];

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
  shares: number;
  pinnedMinor: number | null;
};

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

  const { amounts, remainder, shareTotal } = allocateWeighted(amountMinor, rows);
  if (remainder < 0) {
    throw new Error(
      `The pinned amounts already come to ${formatMoney(amountMinor - remainder, currency)}, which is more than the total.`,
    );
  }
  if (remainder > 0 && shareTotal === 0) {
    throw new Error(
      `${formatMoney(remainder, currency)} is left over and nobody's on shares to absorb it.`,
    );
  }

  return {
    splitType: "exact",
    participants: rows.map((r) => ({ userId: r.userId, value: amounts.get(r.userId) ?? 0 })),
  };
}

export function allocateWeighted(
  amountMinor: number,
  rows: WeightedInput[],
): { amounts: Map<string, number>; remainder: number; shareTotal: number } {
  const pinnedTotal = rows.reduce((sum, r) => sum + (r.pinnedMinor ?? 0), 0);
  const remainder = amountMinor - pinnedTotal;
  const unpinned = rows.filter((r) => r.pinnedMinor === null);
  const shareTotal = unpinned.reduce((sum, r) => sum + r.shares, 0);
  const amounts = new Map(rows.map((r) => [r.userId, r.pinnedMinor ?? 0]));
  if (remainder > 0 && shareTotal > 0) {
    const rest = computeSplits(remainder, "shares", unpinned.map((r) => ({ userId: r.userId, value: r.shares })));
    for (const s of rest) amounts.set(s.userId, s.owedAmountMinor);
  }
  return { amounts, remainder, shareTotal };
}

export type LedgerLine = {
  paidBy: string;
  currency: Currency;
  amountMinor: number;
  splits: { userId: string; owedAmountMinor: number }[];
};

export type LedgerSettlement = {
  from: string;
  to: string;
  currency: Currency;
  amountMinor: number;
  clearsCurrency?: Currency | null;
  clearsAmountMinor?: number | null;
};

export type Balances = Record<Currency, Record<string, number>>;

export function computeBalances(
  lines: LedgerLine[],
  settlements: LedgerSettlement[] = [],
): Balances {
  const balances = Object.fromEntries(
    CURRENCIES.map((c) => [c, {}]),
  ) as Balances;

  for (const line of lines) {
    const book = balances[line.currency];
    for (const split of line.splits) {
      if (split.userId === line.paidBy) continue;
      book[split.userId] = (book[split.userId] ?? 0) - split.owedAmountMinor;
      book[line.paidBy] = (book[line.paidBy] ?? 0) + split.owedAmountMinor;
    }
  }

  for (const s of settlements) {
    const currency = s.clearsCurrency ?? s.currency;
    const amountMinor = s.clearsAmountMinor ?? s.amountMinor;
    const book = balances[currency];
    book[s.from] = (book[s.from] ?? 0) + amountMinor;
    book[s.to] = (book[s.to] ?? 0) - amountMinor;
  }

  return balances;
}

export function isAllSettled(balances: Balances): boolean {
  return CURRENCIES.every((c) =>
    Object.values(balances[c]).every((amount) => amount === 0),
  );
}

export type Settlement = { from: string; to: string; amountMinor: number };

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
