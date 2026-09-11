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
    expect(viewerBalance(undefined, "ada")).toEqual({ currency: "GBP", minor: 0, figure: "settled" });
    expect(viewerBalance(dinner, undefined)).toMatchObject({ minor: 0, figure: "settled" });
  });

  it("says what the payer is owed", () => {
    const balance = viewerBalance(dinner, "ada");
    expect(balance.minor).toBe(2000);
    expect(balance.figure).toMatch(/^owed /);
  });

  it("says what a sharer owes", () => {
    const balance = viewerBalance(dinner, "mo");
    expect(balance.minor).toBe(-1000);
    expect(balance.figure).toMatch(/^owe /);
  });

  it("is settled once a settlement clears the debt", () => {
    const paid = ledger({
      ...dinner,
      settlements: [
        { fromUserId: "mo", toUserId: "ada", currency: "EUR", amountMinor: 1000 },
      ] as Ledger["settlements"],
    });
    expect(viewerBalance(paid, "mo")).toEqual({ currency: "EUR", minor: 0, figure: "settled" });
  });

  it("is settled for someone outside the ledger", () => {
    expect(viewerBalance(dinner, "stranger").figure).toBe("settled");
  });
});
