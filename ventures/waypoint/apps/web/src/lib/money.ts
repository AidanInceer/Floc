/**
 * Money is never a float. Every amount is an integer count of minor units
 * (pence/cents), and every split is snapshotted at creation.
 *
 * Source: .scratch/waypoint-v1/issues/04-core-data-model-and-schema.md
 * The exact-sum invariant is application code by design — the schema cannot
 * enforce it.
 */
import type { Currency, SplitType } from "@/db/schema";

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  GBP: "£",
  EUR: "€",
  USD: "$",
};

/** All three v1 currencies have two decimal places. */
const MINOR_PER_MAJOR = 100;

/**
 * Hard ceiling on any single amount: £1bn in minor units.
 *
 * Not cosmetic. An amount past `Number.MAX_SAFE_INTEGER` writes to SQLite
 * happily, and then *every later read* throws
 * `RangeError: Received integer which cannot be safely represented as a
 * JavaScript number` — so one silly expense locks the whole group out of the
 * trip, Overview included. Rejecting at the door is the only place that can't
 * be bypassed (ticket 33).
 */
export const MAX_AMOUNT_MINOR = 100_000_000_000;

function assertInRange(amountMinor: number): void {
  if (!Number.isFinite(amountMinor) || Math.abs(amountMinor) > MAX_AMOUNT_MINOR) {
    throw new Error("That amount is too large — keep it under a billion.");
  }
}

export function formatMoney(amountMinor: number, currency: Currency): string {
  const negative = amountMinor < 0;
  const abs = Math.abs(amountMinor);
  const major = Math.floor(abs / MINOR_PER_MAJOR);
  const minor = abs % MINOR_PER_MAJOR;
  const body = `${CURRENCY_SYMBOLS[currency]}${major.toLocaleString("en-GB")}.${String(
    minor,
  ).padStart(2, "0")}`;
  return negative ? `−${body}` : body;
}

/** Parses "12.34", "12", "£12.34" into minor units. Throws on nonsense. */
export function parseMoney(input: string): number {
  const cleaned = input.replace(/[£€$,\s]/g, "");
  if (!/^-?\d+(\.\d{1,2})?$/.test(cleaned)) {
    throw new Error(`Not a valid amount: ${input}`);
  }
  const negative = cleaned.startsWith("-");
  const [major, minor = ""] = cleaned.replace("-", "").split(".");
  const total =
    Number(major) * MINOR_PER_MAJOR + Number(minor.padEnd(2, "0") || 0);
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
 * Turns a split type plus participant list into snapshot rows summing to
 * exactly `amountMinor`.
 *
 * Remainder pennies are handed out one each to the earliest participants,
 * deterministically — so the sum invariant holds and nobody is silently
 * short-changed by rounding.
 */
export function computeSplits(
  amountMinor: number,
  splitType: SplitType,
  participants: SplitInput[],
): SplitResult[] {
  if (participants.length === 0) {
    throw new Error("An expense needs at least one participant");
  }
  if (!Number.isInteger(amountMinor)) {
    throw new Error("amountMinor must be an integer number of minor units");
  }
  // Belt and braces: `parseMoney` is the usual door, but splits can be built
  // from a raw number too, and an out-of-range total must never reach the DB.
  assertInRange(amountMinor);

  switch (splitType) {
    case "even":
      return distribute(
        amountMinor,
        participants.map(() => 1),
        participants,
      );

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

    case "percentage": {
      const weights = participants.map((p) => p.value ?? 0);
      const total = weights.reduce((a, b) => a + b, 0);
      if (Math.abs(total - 100) > 0.001) {
        throw new Error(`Percentages must sum to 100, got ${total}`);
      }
      return distribute(amountMinor, weights, participants);
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

/* -------------------------------------------------------------------------- */
/* One split model: shares, with pinned amounts (ticket 85)                    */
/* -------------------------------------------------------------------------- */

export type WeightedInput = {
  userId: string;
  /** How many shares of whatever is left this person carries. */
  shares: number;
  /** A fixed amount in minor units — "Ravi owes exactly £30" — or null. */
  pinnedMinor: number | null;
};

/**
 * The form asks one question now (ticket 85): everyone holds shares of the
 * cost, and anyone can be *pinned* to a fixed amount instead. Even is everyone
 * on one share; "exact amounts" is everyone pinned; percentages are shares that
 * happen to add to a hundred. The four split types stop being modes you pick.
 *
 * They stay in the schema, because `expense.split_type` is written on rows that
 * already exist and `expense_split` is a snapshot that is never recalculated
 * (non-negotiable 2). So this resolves the one live model back into the stored
 * vocabulary rather than adding to it:
 *
 *   nothing pinned → `shares`, values are the shares
 *   anything pinned → `exact`, values are the amounts this works out
 *
 * Either way `computeSplits` does the actual arithmetic and the exact-sum
 * invariant is checked in exactly one place.
 */
export function resolveWeightedSplit(
  amountMinor: number,
  rows: WeightedInput[],
): { splitType: SplitType; participants: SplitInput[] } {
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
      `The pinned amounts already come to ${formatMinor(pinnedTotal)}, which is more than the total.`,
    );
  }

  const unpinned = rows.filter((r) => r.pinnedMinor === null);
  const shareTotal = unpinned.reduce((sum, r) => sum + r.shares, 0);
  if (remainder > 0 && shareTotal === 0) {
    // Nothing left holding shares, so there is nowhere for the rest to go —
    // say so rather than quietly losing it.
    throw new Error(
      `${formatMinor(remainder)} is left over and nobody's on shares to absorb it.`,
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

/** Bare minor units as a decimal — currency-less, for error strings. */
function formatMinor(amountMinor: number): string {
  return (amountMinor / MINOR_PER_MAJOR).toFixed(2);
}

/* -------------------------------------------------------------------------- */
/* Balances — derived at read time, never stored (ticket 04)                   */
/* -------------------------------------------------------------------------- */

export type LedgerLine = {
  paidBy: string;
  currency: Currency;
  amountMinor: number;
  splits: { userId: string; owedAmountMinor: number; settled: boolean }[];
};

/** Per-currency net position for each member: positive = owed money back. */
export type Balances = Record<Currency, Record<string, number>>;

export function computeBalances(lines: LedgerLine[]): Balances {
  const balances: Balances = { GBP: {}, EUR: {}, USD: {} };

  for (const line of lines) {
    const book = balances[line.currency];
    for (const split of line.splits) {
      // A settled split is a claim that the debt was paid off-app, so it
      // stops affecting the outstanding position.
      if (split.settled) continue;
      if (split.userId === line.paidBy) continue;
      book[split.userId] = (book[split.userId] ?? 0) - split.owedAmountMinor;
      book[line.paidBy] = (book[line.paidBy] ?? 0) + split.owedAmountMinor;
    }
  }

  return balances;
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
