import { describe, expect, it } from "vitest";

import {
  computeBalances,
  computeSplits,
  formatMoney,
  parseMoney,
  resolveWeightedSplit,
  suggestSettlements,
} from "./money";

const people = (...ids: string[]) => ids.map((userId) => ({ userId }));

describe("formatMoney / parseMoney", () => {
  it("round-trips through minor units", () => {
    expect(parseMoney("12.34")).toBe(1234);
    expect(parseMoney("£1,200")).toBe(120000);
    expect(parseMoney("0.05")).toBe(5);
    expect(formatMoney(1234, "GBP")).toBe("£12.34");
    expect(formatMoney(120000, "EUR")).toBe("€1,200.00");
    expect(formatMoney(-500, "USD")).toBe("−$5.00");
  });

  it("rejects anything that is not an exact amount", () => {
    expect(() => parseMoney("12.345")).toThrow();
    expect(() => parseMoney("twelve")).toThrow();
  });

  // Ticket 33: an amount past the safe-integer range used to write fine and
  // then make every later read of the trip throw, locking the group out of
  // Overview. It has to be refused at parse time.
  it("refuses an amount too large to survive a round trip", () => {
    expect(parseMoney("999999999.99")).toBe(99999999999);
    expect(() => parseMoney("99999999999999999999")).toThrow(/too large/);
    expect(() => parseMoney("-99999999999999999999")).toThrow(/too large/);
    expect(() => computeSplits(1e15, "even", people("a", "b"))).toThrow(
      /too large/,
    );
  });
});

describe("computeSplits", () => {
  it("splits evenly and hands out remainder pennies deterministically", () => {
    const rows = computeSplits(1000, "even", people("a", "b", "c"));
    expect(rows.map((r) => r.owedAmountMinor)).toEqual([334, 333, 333]);
    expect(sum(rows)).toBe(1000);
  });

  it("always sums to the total for every even split of 1..200 across 1..7 people", () => {
    for (let total = 1; total <= 200; total++) {
      for (let n = 1; n <= 7; n++) {
        const rows = computeSplits(
          total,
          "even",
          people(...Array.from({ length: n }, (_, i) => `u${i}`)),
        );
        expect(sum(rows)).toBe(total);
      }
    }
  });

  it("accepts exact splits that sum, rejects those that do not", () => {
    const rows = computeSplits(1000, "exact", [
      { userId: "a", value: 600 },
      { userId: "b", value: 400 },
    ]);
    expect(sum(rows)).toBe(1000);
    expect(() =>
      computeSplits(1000, "exact", [
        { userId: "a", value: 600 },
        { userId: "b", value: 300 },
      ]),
    ).toThrow(/must sum to the total/);
  });

  it("splits by percentage and requires 100", () => {
    const rows = computeSplits(1001, "percentage", [
      { userId: "a", value: 33.33 },
      { userId: "b", value: 33.33 },
      { userId: "c", value: 33.34 },
    ]);
    expect(sum(rows)).toBe(1001);
    expect(() =>
      computeSplits(100, "percentage", [
        { userId: "a", value: 50 },
        { userId: "b", value: 40 },
      ]),
    ).toThrow(/sum to 100/);
  });

  it("splits by shares", () => {
    const rows = computeSplits(900, "shares", [
      { userId: "a", value: 2 },
      { userId: "b", value: 1 },
    ]);
    expect(rows).toEqual([
      { userId: "a", owedAmountMinor: 600 },
      { userId: "b", owedAmountMinor: 300 },
    ]);
  });

  it("refuses an expense with no participants", () => {
    expect(() => computeSplits(100, "even", [])).toThrow();
  });
});

describe("computeBalances / suggestSettlements", () => {
  it("nets out who owes whom, per currency", () => {
    const balances = computeBalances([
      {
        paidBy: "a",
        currency: "GBP",
        amountMinor: 3000,
        splits: [
          { userId: "a", owedAmountMinor: 1000, settled: false },
          { userId: "b", owedAmountMinor: 1000, settled: false },
          { userId: "c", owedAmountMinor: 1000, settled: false },
        ],
      },
      {
        paidBy: "b",
        currency: "GBP",
        amountMinor: 600,
        splits: [
          { userId: "a", owedAmountMinor: 300, settled: false },
          { userId: "b", owedAmountMinor: 300, settled: false },
        ],
      },
    ]);

    expect(balances.GBP).toEqual({ a: 1700, b: -700, c: -1000 });
    expect(Object.values(balances.GBP).reduce((x, y) => x + y, 0)).toBe(0);
    expect(balances.EUR).toEqual({});
  });

  it("ignores a split once it is marked settled", () => {
    const balances = computeBalances([
      {
        paidBy: "a",
        currency: "GBP",
        amountMinor: 2000,
        splits: [
          { userId: "a", owedAmountMinor: 1000, settled: false },
          { userId: "b", owedAmountMinor: 1000, settled: true },
        ],
      },
    ]);
    expect(balances.GBP).toEqual({});
  });

  it("suggests transfers that clear every balance", () => {
    const book = { a: 1700, b: -700, c: -1000 };
    const settlements = suggestSettlements(book);
    const applied = { ...book };
    for (const s of settlements) {
      applied[s.from as keyof typeof applied] += s.amountMinor;
      applied[s.to as keyof typeof applied] -= s.amountMinor;
    }
    expect(Object.values(applied)).toEqual([0, 0, 0]);
  });
});

describe("resolveWeightedSplit (ticket 85)", () => {
  const row = (userId: string, shares: number, pinnedMinor: number | null = null) => ({
    userId,
    shares,
    pinnedMinor,
  });

  it("stays a shares split when nobody is pinned", () => {
    const resolved = resolveWeightedSplit(8400, [row("a", 1), row("b", 1), row("c", 1)]);
    expect(resolved.splitType).toBe("shares");
    expect(resolved.participants).toEqual([
      { userId: "a", value: 1 },
      { userId: "b", value: 1 },
      { userId: "c", value: 1 },
    ]);
  });

  it("pins one person and spreads the rest by shares, summing exactly", () => {
    const resolved = resolveWeightedSplit(8400, [
      row("a", 1),
      row("b", 1),
      row("c", 0, 3000),
    ]);
    expect(resolved.splitType).toBe("exact");
    expect(resolved.participants).toEqual([
      { userId: "a", value: 2700 },
      { userId: "b", value: 2700 },
      { userId: "c", value: 3000 },
    ]);
    // The result still has to survive the one place the invariant is checked.
    expect(sum(computeSplits(8400, "exact", resolved.participants))).toBe(8400);
  });

  it("hands the odd penny out deterministically", () => {
    const resolved = resolveWeightedSplit(1000, [row("a", 1), row("b", 1), row("c", 1)]);
    expect(sum(computeSplits(1000, "shares", resolved.participants))).toBe(1000);
  });

  it("treats everyone pinned as exact amounts", () => {
    const resolved = resolveWeightedSplit(5000, [row("a", 0, 2000), row("b", 0, 3000)]);
    expect(resolved.splitType).toBe("exact");
    expect(sum(computeSplits(5000, "exact", resolved.participants))).toBe(5000);
  });

  it("refuses pins that overshoot the total", () => {
    expect(() => resolveWeightedSplit(4000, [row("a", 1), row("b", 0, 5000)])).toThrow(
      /more than the total/,
    );
  });

  it("refuses a leftover with nobody on shares to absorb it", () => {
    expect(() => resolveWeightedSplit(4000, [row("a", 0), row("b", 0, 1000)])).toThrow(
      /nobody's on shares/,
    );
  });

  it("gives an unpinned person with no shares nothing", () => {
    const resolved = resolveWeightedSplit(3000, [
      row("a", 1),
      row("b", 0),
      row("c", 0, 1000),
    ]);
    expect(resolved.participants).toEqual([
      { userId: "a", value: 2000 },
      { userId: "b", value: 0 },
      { userId: "c", value: 1000 },
    ]);
  });

  it("rejects negative shares", () => {
    expect(() => resolveWeightedSplit(1000, [row("a", -1)])).toThrow(/negative/);
  });
});

function sum(rows: { owedAmountMinor: number }[]) {
  return rows.reduce((a, r) => a + r.owedAmountMinor, 0);
}
