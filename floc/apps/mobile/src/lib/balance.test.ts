import { describe, expect, it } from "vitest";

import type { Ledger } from "@floc/api/port";

import { ledgerCurrency, viewerBalance } from "./balance";

function ledger(parts: Partial<Ledger>): Ledger {
  return { expenses: [], splits: [], settlements: [], ...parts } as unknown as Ledger;
}

const dinner = ledger({
  expenses: [{ id: 1, paidBy: "ada", currency: "EUR", amountMinor: 3000 }] as Ledger["expenses"],
  splits: [
    { expenseId: 1, userId: "ada", owedAmountMinor: 1000 },
    { expenseId: 1, userId: "mo", owedAmountMinor: 1000 },
    { expenseId: 1, userId: "ozz", owedAmountMinor: 1000 },
  ] as Ledger["splits"],
});

describe("ledgerCurrency", () => {
  it("reads the first expense's currency", () => {
    expect(ledgerCurrency(dinner)).toBe("EUR");
  });

  it("falls back to sterling with no ledger or no expenses", () => {
    expect(ledgerCurrency(undefined)).toBe("GBP");
    expect(ledgerCurrency(ledger({}))).toBe("GBP");
  });
});

describe("viewerBalance", () => {
  it("is settled before the ledger or the viewer is known", () => {
    expect(viewerBalance(undefined, "ada")).toEqual({ figure: "settled", owing: false, settled: true });
    expect(viewerBalance(dinner, undefined)).toMatchObject({ settled: true });
  });

  it("says what the payer is owed", () => {
    expect(viewerBalance(dinner, "ada")).toEqual({ figure: "owed €20.00", owing: false, settled: false });
  });

  it("says what a sharer owes", () => {
    expect(viewerBalance(dinner, "mo")).toEqual({ figure: "owe €10.00", owing: true, settled: false });
  });

  it("is settled once a settlement clears the debt", () => {
    const paid = ledger({
      ...dinner,
      settlements: [
        { fromUserId: "mo", toUserId: "ada", currency: "EUR", amountMinor: 1000 },
      ] as Ledger["settlements"],
    });
    expect(viewerBalance(paid, "mo")).toMatchObject({ figure: "settled", settled: true });
  });

  it("is settled for someone outside the ledger", () => {
    expect(viewerBalance(dinner, "stranger").figure).toBe("settled");
  });

  it("reads every currency, not only the first expense's (#317)", () => {
    const twoBooks = ledger({
      expenses: [
        ...dinner.expenses,
        { id: 2, paidBy: "mo", currency: "GBP", amountMinor: 900 },
      ] as Ledger["expenses"],
      splits: [
        ...dinner.splits,
        { expenseId: 2, userId: "ada", owedAmountMinor: 900 },
      ] as Ledger["splits"],
    });
    expect(viewerBalance(twoBooks, "ada")).toEqual({
      figure: "owe £9.00 · owed €20.00",
      owing: true,
      settled: false,
    });
  });
});
