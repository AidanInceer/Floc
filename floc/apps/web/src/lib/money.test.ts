import { describe, expect, it } from "vitest";

import {
  computeBalances,
  computeSplits,
  convertMinor,
  convertTotal,
  crossRate,
  formatMoney,
  formatTicker,
  isAllSettled,
  maxExpenseMinor,
  parseMoney,
  resolveWeightedSplit,
  suggestSettlements,
} from "./money";
import { CURRENCIES, currencySymbol, type Currency } from "./currency";

/** An even split is one share each since ticket 85 — see `WritableSplitType`. */
const people = (...ids: string[]) => ids.map((userId) => ({ userId, value: 1 }));

describe("formatMoney / parseMoney", () => {
  it("round-trips through minor units", () => {
    expect(parseMoney("12.34", "GBP")).toBe(1234);
    expect(parseMoney("£1,200", "GBP")).toBe(120000);
    expect(parseMoney("0.05", "GBP")).toBe(5);
    expect(formatMoney(1234, "GBP")).toBe("£12.34");
    expect(formatMoney(120000, "EUR")).toBe("€1,200.00");
    // Ticker form for the convert control: ISO code, not a symbol.
    expect(formatTicker(1234, "GBP")).toBe("GBP 12.34");
    expect(formatTicker(560000, "USD")).toBe("USD 5,600.00");
    // `$` names seven currencies in the list, so USD prints its code (ticket 253).
    expect(formatMoney(1234, "USD")).toBe("USD 12.34");
    expect(formatMoney(-500, "USD")).toBe("−USD 5.00");
  });

  it("rejects anything that is not an exact amount", () => {
    expect(() => parseMoney("12.345", "GBP")).toThrow();
    expect(() => parseMoney("twelve", "GBP")).toThrow();
  });

  // Ticket 33: an amount past the safe-integer range used to write fine and
  // then make every later read of the trip throw, locking the group out of
  // Overview. It has to be refused at parse time.
  it("refuses an amount too large to survive a round trip", () => {
    expect(parseMoney("999999999.99", "GBP")).toBe(99999999999);
    expect(() => parseMoney("99999999999999999999", "GBP")).toThrow(/too large/);
    expect(() => parseMoney("-99999999999999999999", "GBP")).toThrow(/too large/);
    expect(() => computeSplits(1e15, "shares", people("a", "b"))).toThrow(
      /too large/,
    );
  });
});

describe("computeSplits", () => {
  it("splits evenly and hands out remainder pennies deterministically", () => {
    const rows = computeSplits(1000, "shares", people("a", "b", "c"));
    expect(rows.map((r) => r.owedAmountMinor)).toEqual([334, 333, 333]);
    expect(sum(rows)).toBe(1000);
  });

  it("always sums to the total for every even split of 1..200 across 1..7 people", () => {
    for (let total = 1; total <= 200; total++) {
      for (let n = 1; n <= 7; n++) {
        const rows = computeSplits(
          total,
          "shares",
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
    expect(() => computeSplits(100, "shares", [])).toThrow();
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
          { userId: "a", owedAmountMinor: 1000 },
          { userId: "b", owedAmountMinor: 1000 },
          { userId: "c", owedAmountMinor: 1000 },
        ],
      },
      {
        paidBy: "b",
        currency: "GBP",
        amountMinor: 600,
        splits: [
          { userId: "a", owedAmountMinor: 300 },
          { userId: "b", owedAmountMinor: 300 },
        ],
      },
    ]);

    expect(balances.GBP).toEqual({ a: 1700, b: -700, c: -1000 });
    expect(Object.values(balances.GBP).reduce((x, y) => x + y, 0)).toBe(0);
    expect(balances.EUR).toEqual({});
  });

  it("a settlement nets off the debt it pays", () => {
    const balances = computeBalances(
      [
        {
          paidBy: "a",
          currency: "GBP",
          amountMinor: 2000,
          splits: [
            { userId: "a", owedAmountMinor: 1000 },
            { userId: "b", owedAmountMinor: 1000 },
          ],
        },
      ],
      [{ from: "b", to: "a", currency: "GBP", amountMinor: 1000 }],
    );
    expect(balances.GBP).toEqual({ a: 0, b: 0 });
    expect(isAllSettled(balances)).toBe(true);
  });

  it("overpays into a reverse balance when the underlying expense shrinks", () => {
    // b paid a £10, then the £10 debt turned out to be £6: a now owes b £4.
    const balances = computeBalances(
      [
        {
          paidBy: "a",
          currency: "GBP",
          amountMinor: 1200,
          splits: [
            { userId: "a", owedAmountMinor: 600 },
            { userId: "b", owedAmountMinor: 600 },
          ],
        },
      ],
      [{ from: "b", to: "a", currency: "GBP", amountMinor: 1000 }],
    );
    expect(balances.GBP).toEqual({ a: -400, b: 400 });
    expect(isAllSettled(balances)).toBe(false);
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
    const resolved = resolveWeightedSplit(8400, [row("a", 1), row("b", 1), row("c", 1)], "GBP");
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
    ], "GBP");
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
    const resolved = resolveWeightedSplit(1000, [row("a", 1), row("b", 1), row("c", 1)], "GBP");
    expect(sum(computeSplits(1000, "shares", resolved.participants))).toBe(1000);
  });

  it("treats everyone pinned as exact amounts", () => {
    const resolved = resolveWeightedSplit(5000, [row("a", 0, 2000), row("b", 0, 3000)], "GBP");
    expect(resolved.splitType).toBe("exact");
    expect(sum(computeSplits(5000, "exact", resolved.participants))).toBe(5000);
  });

  it("refuses pins that overshoot the total", () => {
    expect(() => resolveWeightedSplit(4000, [row("a", 1), row("b", 0, 5000)], "GBP")).toThrow(
      /more than the total/,
    );
  });

  it("refuses a leftover with nobody on shares to absorb it", () => {
    expect(() => resolveWeightedSplit(4000, [row("a", 0), row("b", 0, 1000)], "GBP")).toThrow(
      /nobody's on shares/,
    );
  });

  it("gives an unpinned person with no shares nothing", () => {
    const resolved = resolveWeightedSplit(3000, [
      row("a", 1),
      row("b", 0),
      row("c", 0, 1000),
    ], "GBP");
    expect(resolved.participants).toEqual([
      { userId: "a", value: 2000 },
      { userId: "b", value: 0 },
      { userId: "c", value: 1000 },
    ]);
  });

  it("rejects negative shares", () => {
    expect(() => resolveWeightedSplit(1000, [row("a", -1)], "GBP")).toThrow(/negative/);
  });
});

function sum(rows: { owedAmountMinor: number }[]) {
  return rows.reduce((a, r) => a + r.owedAmountMinor, 0);
}

/**
 * Ticket 115 (S7). `computeBalances` used to seed itself from a literal
 * `{ GBP: {}, EUR: {}, USD: {} }`. A fourth currency added to `CURRENCIES` and
 * not added here produced an `undefined` at runtime rather than a type error —
 * in the money path, where nothing is computed by hand (rule 1).
 */
describe("computeBalances seeds itself from CURRENCIES", () => {
  it("has a book for every currency, with none left over", () => {
    const balances = computeBalances([]);
    expect(Object.keys(balances).sort()).toEqual([...CURRENCIES].sort());
  });

  it("finds a book for whichever currency a line is in", () => {
    for (const currency of CURRENCIES) {
      const balances = computeBalances([
        {
          paidBy: "a",
          currency,
          amountMinor: 1000,
          splits: [
            { userId: "a", owedAmountMinor: 500 },
            { userId: "b", owedAmountMinor: 500 },
          ],
        },
      ]);
      expect(balances[currency].a).toBe(500);
      expect(balances[currency].b).toBe(-500);
    }
  });
});

describe("the awkward halves of the money helpers", () => {
  it("carries a minus sign through format and parse", () => {
    expect(formatMoney(-1234, "GBP")).toBe("−£12.34");
    expect(parseMoney("-12", "GBP")).toBe(-1200);
    expect(parseMoney("-0.5", "GBP")).toBe(-50);
  });

  it("refuses an amount that is not whole minor units", () => {
    expect(() => computeSplits(10.5, "shares", people("a"))).toThrow(/integer/);
  });

  it("refuses shares that are negative or all zero", () => {
    expect(() =>
      computeSplits(1000, "shares", [{ userId: "a", value: -1 }]),
    ).toThrow(/non-negative/);
    expect(() =>
      computeSplits(1000, "shares", [{ userId: "a", value: 0 }]),
    ).toThrow(/non-negative/);
  });

  it("splits a refund — a negative total — and still sums exactly", () => {
    const rows = computeSplits(-1000, "shares", people("a", "b", "c"));
    expect(rows.reduce((a, r) => a + r.owedAmountMinor, 0)).toBe(-1000);
    expect(rows.every((r) => r.owedAmountMinor < 0)).toBe(true);
  });

  it("treats a missing exact value as nothing owed", () => {
    expect(
      computeSplits(1000, "exact", [
        { userId: "a", value: 1000 },
        { userId: "b" },
      ]),
    ).toEqual([
      { userId: "a", owedAmountMinor: 1000 },
      { userId: "b", owedAmountMinor: 0 },
    ]);
  });

  it("refuses an expense with nobody in it", () => {
    expect(() => resolveWeightedSplit(1000, [], "GBP")).toThrow(/at least one/);
  });
});

// Ticket 253. `MINOR_PER_MAJOR` used to be hardcoded to 100, so a yen amount
// would have been stored — and split — a hundredfold wrong.
describe("zero-decimal currencies", () => {
  it("formats and parses without a decimal point", () => {
    expect(formatMoney(5600, "JPY")).toBe("JPY 5,600");
    expect(formatTicker(5600, "JPY")).toBe("JPY 5,600");
    expect(parseMoney("5600", "JPY")).toBe(5600);
    expect(parseMoney("¥5,600", "JPY")).toBe(5600);
    // A typed "5600.00" is a mistake, not a hundredfold amount.
    expect(() => parseMoney("5600.00", "JPY")).toThrow();
  });

  it("keeps the exact-sum invariant on a three-way split", () => {
    const rows = computeSplits(5600, "shares", people("a", "b", "c"));
    expect(sum(rows)).toBe(5600);
    expect(rows.map((r) => r.owedAmountMinor)).toEqual([1867, 1867, 1866]);
  });

  it("caps an expense in the currency's own major units", () => {
    expect(maxExpenseMinor("JPY")).toBe(1_000_000);
    expect(maxExpenseMinor("GBP")).toBe(100_000_000);
  });
});

describe("symbols and codes (ticket 253)", () => {
  it("uses a symbol only where it names one currency in the list", () => {
    expect(currencySymbol("GBP")).toBe("£");
    expect(currencySymbol("INR")).toBe("₹");
    // `$` covers seven of these, `kr` four, `¥` two — those print their code.
    for (const c of ["USD", "AUD", "CAD", "SEK", "ISK", "JPY", "CNY"] as const) {
      expect(currencySymbol(c)).toBeNull();
      expect(formatMoney(100, c).startsWith(c)).toBe(true);
    }
  });
});

describe("cross-currency settlement (ticket 253)", () => {
  const line = {
    paidBy: "sam",
    currency: "EUR" as const,
    amountMinor: 6240,
    splits: [
      { userId: "sam", owedAmountMinor: 3120 },
      { userId: "you", owedAmountMinor: 3120 },
    ],
  };

  it("credits the cleared currency, not the currency handed over", () => {
    const balances = computeBalances(
      [line],
      [
        {
          from: "you",
          to: "sam",
          currency: "GBP",
          amountMinor: 2700,
          clearsCurrency: "EUR",
          clearsAmountMinor: 3120,
        },
      ],
    );
    expect(balances.EUR.you).toBe(0);
    expect(balances.EUR.sam).toBe(0);
    // No GBP debt was ever created, so nothing lands in the GBP book.
    expect(balances.GBP.you).toBeUndefined();
    expect(isAllSettled(balances)).toBe(true);
  });

  it("leaves the overpayment in the cleared currency when the expense goes", () => {
    // Same settlement, expense since deleted — the settlement stands.
    const balances = computeBalances(
      [],
      [
        {
          from: "you",
          to: "sam",
          currency: "GBP",
          amountMinor: 2700,
          clearsCurrency: "EUR",
          clearsAmountMinor: 3120,
        },
      ],
    );
    expect(balances.EUR.you).toBe(3120);
    expect(balances.EUR.sam).toBe(-3120);
  });

  it("behaves exactly as before when the currencies match", () => {
    const balances = computeBalances(
      [line],
      [{ from: "you", to: "sam", currency: "EUR", amountMinor: 3120 }],
    );
    expect(balances.EUR.you).toBe(0);
  });
});

describe("display conversion (ticket 253)", () => {
  // 1 EUR = 0.86 GBP, and JPY is zero-decimal, so the exponents must not cancel.
  const quotes: Partial<Record<Currency, number>> = {
    GBP: 1,
    EUR: 0.86,
    JPY: 0.0052,
  };
  const rateFor = (c: Currency) => quotes[c] ?? null;

  it("rounds each row, then sums the rounded rows", () => {
    // €31.20 → £26.83 (26.832), €10.05 → £8.64 (8.643). Rounded first: 3547.
    const total = convertTotal(
      [
        { currency: "EUR", amountMinor: 3120 },
        { currency: "EUR", amountMinor: 1005 },
      ],
      "GBP",
      rateFor,
    );
    expect(total).toBe(2683 + 864);
  });

  it("crosses the exponent gap between a 0- and 2-decimal currency", () => {
    // ¥5,600 at 0.0052 GBP per yen is £29.12 — 2912 pence, not 29 or 291,200.
    expect(convertMinor(5600, "JPY", "GBP", 0.0052)).toBe(2912);
    // And back: £29.12 → ¥5,600.
    expect(convertMinor(2912, "GBP", "JPY", 1 / 0.0052)).toBe(5600);
  });

  it("refuses a total when one currency has no rate", () => {
    expect(
      convertTotal(
        [{ currency: "USD", amountMinor: 1000 }],
        "GBP",
        () => null,
      ),
    ).toBeNull();
  });

  it("derives a cross rate from two quotes against the same base", () => {
    // Both quoted in GBP: 1 EUR = 0.86 GBP, 1 JPY = 0.0052 GBP.
    const rate = crossRate("EUR", "JPY", rateFor);
    expect(rate).toBeCloseTo(0.86 / 0.0052, 6);
    expect(crossRate("EUR", "EUR", () => null)).toBe(1);
  });
});
