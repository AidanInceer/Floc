import { describe, expect, it } from "vitest";

import { ledgerBalances } from "./ledger";

const expenses = [{ id: 1, paidBy: "ada", currency: "EUR" as const, amountMinor: 1000 }];
const splits = [
  { expenseId: 1, userId: "ada", owedAmountMinor: 500 },
  { expenseId: 1, userId: "mo", owedAmountMinor: 500 },
];

describe("balances from a ledger", () => {
  it("nets expenses by their own splits", () => {
    const book = ledgerBalances({ expenses, splits, settlements: [] });
    expect(book.EUR).toEqual({ ada: 500, mo: -500 });
  });

  it("books a cross-currency settlement against the debt it clears", () => {
    const book = ledgerBalances({
      expenses,
      splits,
      settlements: [
        {
          fromUserId: "mo",
          toUserId: "ada",
          currency: "GBP" as const,
          amountMinor: 430,
          clearsCurrency: "EUR" as const,
          clearsAmountMinor: 500,
        },
      ],
    });
    expect(book.EUR).toEqual({ ada: 0, mo: 0 });
    expect(book.GBP).toEqual({});
  });

  it("ignores a split whose expense is not in the ledger", () => {
    const book = ledgerBalances({
      expenses: [],
      splits,
      settlements: [],
    });
    expect(book.EUR).toEqual({});
  });
});
