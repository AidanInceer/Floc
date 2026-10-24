import { describe, expect, it } from "vitest";

import type { Ledger } from "@floc/api/port";
import type { Currency } from "@floc/core/money/currency";
import type { SettleRow } from "@floc/core/money/group-settle";

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

const row = (payer: string, payee: string, amountMinor: number, currency: Currency = "EUR"): SettleRow => ({
  payer,
  payee,
  currency,
  amountMinor,
  netted: false,
  parts: [],
});

describe("viewerBalance", () => {
  it("is settled before the payments or the viewer are known", () => {
    expect(viewerBalance(undefined, "ada")).toEqual({ figure: "settled", owing: false, settled: true });
    expect(viewerBalance([row("mo", "ada", 1000)], undefined)).toMatchObject({ settled: true });
  });

  it("says what the payee is owed", () => {
    expect(viewerBalance([row("mo", "ada", 1000), row("ozz", "ada", 1000)], "ada")).toEqual({ figure: "owed €20.00", owing: false, settled: false });
  });

  it("says what a payer owes", () => {
    expect(viewerBalance([row("mo", "ada", 1000)], "mo")).toEqual({ figure: "owe €10.00", owing: true, settled: false });
  });

  it("is settled for someone in none of the payments", () => {
    expect(viewerBalance([row("mo", "ada", 1000)], "stranger").figure).toBe("settled");
  });

  it("says each currency's figure when the payments came without a rate (rule 11)", () => {
    expect(viewerBalance([row("ada", "mo", 900, "GBP"), row("ozz", "ada", 2000)], "ada")).toEqual({
      figure: "owed €20.00 · owe £9.00",
      owing: true,
      settled: false,
    });
  });
});
