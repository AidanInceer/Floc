import { describe, expect, it } from "vitest";

import type { Currency } from "./currency";
import { groupSettleUp, paidIn, type SettleRow } from "./group-settle";
import { computeBalances, isAllSettled, type Balances, type LedgerLine } from "./money";

// Euros per one of each currency, as frankfurter quotes them against the euro.
const eurBase = (c: Currency) => (c === "EUR" ? 1 : c === "GBP" ? 1.2 : null);
const homes: Record<string, Currency> = { me: "GBP", priya: "GBP", sofia: "EUR", tom: "GBP" };
const homeOf = (id: string) => homes[id] ?? "GBP";

const owes = (from: string, to: string, amountMinor: number, currency: Currency): LedgerLine => ({
  paidBy: to,
  currency,
  amountMinor,
  splits: [{ userId: from, owedAmountMinor: amountMinor }],
});

/** Portugal: you owe Priya £117.15; Sofia owes you €96.40. */
const portugal = (): Balances => computeBalances([owes("me", "priya", 11715, "GBP"), owes("sofia", "me", 9640, "EUR")]);

const settle = (balances: Balances, viewerId = "me", rateFor = eurBase) =>
  groupSettleUp({ balances, viewerId, homeOf, base: "EUR", rateFor });

/** Records every row's parts as settlements and reads the books again. */
function afterPaying(lines: LedgerLine[], rows: SettleRow[]): Balances {
  const settlements = rows.flatMap((r) =>
    r.parts.map((p) => ({ from: p.fromUserId, to: p.toUserId, currency: p.currency, amountMinor: p.amountMinor, clearsCurrency: p.clearsCurrency ?? null, clearsAmountMinor: p.clearsAmountMinor ?? null })),
  );
  return computeBalances(lines, settlements);
}

const brief = (rows: SettleRow[]) => rows.map((r) => [r.payer, r.payee, r.currency, r.amountMinor]);

describe("groupSettleUp", () => {
  it("finds the payments for the whole group across currencies, not one set per currency", () => {
    expect(brief(settle(portugal()))).toEqual([
      ["sofia", "priya", "GBP", 8033],
      ["me", "priya", "GBP", 3682],
    ]);
  });

  it("shows every amount in the viewer's home currency", () => {
    expect(brief(settle(portugal(), "sofia"))).toEqual([
      ["sofia", "priya", "EUR", 9640],
      ["me", "priya", "EUR", 4418],
    ]);
  });

  it("records each payment in the payer's home currency, clearing each debt in its own", () => {
    const mine = settle(portugal()).find((r) => r.payer === "me")!;
    expect(mine.netted).toBe(true);
    expect(mine.parts).toEqual([
      { fromUserId: "me", toUserId: "priya", amountMinor: 11715, currency: "GBP" },
      { fromUserId: "priya", toUserId: "me", amountMinor: 8033, currency: "GBP", clearsAmountMinor: 9640, clearsCurrency: "EUR", fxRate: 1.2 },
    ]);
  });

  it("says what the payer hands over in their own currency, whoever is looking", () => {
    const theirs = settle(portugal(), "me").find((r) => r.payer === "sofia")!;
    expect(paidIn(theirs)).toEqual({ currency: "EUR", amountMinor: 9640 });
  });

  it("leaves every currency at exactly zero once every payment is made", () => {
    const lines = [owes("me", "priya", 11715, "GBP"), owes("sofia", "me", 9640, "EUR"), owes("tom", "sofia", 1234, "EUR"), owes("priya", "tom", 999, "GBP")];
    const rows = settle(computeBalances(lines));
    expect(isAllSettled(afterPaying(lines, rows))).toBe(true);
  });

  it("matches the greedy fewest payments when there is one currency", () => {
    const balances = computeBalances([owes("me", "priya", 3000, "GBP"), owes("tom", "priya", 1000, "GBP")]);
    expect(brief(settle(balances))).toEqual([
      ["me", "priya", "GBP", 3000],
      ["tom", "priya", "GBP", 1000],
    ]);
    expect(settle(balances).every((r) => !r.netted)).toBe(true);
  });

  it("keeps each currency on its own rows when there is no rate (rule 11)", () => {
    const rows = settle(portugal(), "me", (c) => (c === "EUR" ? 1 : null));
    expect(brief(rows)).toEqual([
      ["me", "priya", "GBP", 11715],
      ["sofia", "me", "EUR", 9640],
    ]);
    expect(rows.every((r) => !r.netted)).toBe(true);
  });

  it("falls back to one payment per pair when converted payments cannot clear each currency", () => {
    // Why: Bo is owed a penny in one currency and owes one in the other, so the converted plan leaves Bo out.
    const lines = [owes("sam", "ana", 1, "EUR"), owes("bo", "sam", 1, "EUR"), owes("sam", "bo", 1, "GBP"), owes("ana", "cy", 2, "GBP")];
    const rate = (c: Currency) => (c === "EUR" || c === "GBP" ? 1 : null);
    const rows = groupSettleUp({ balances: computeBalances(lines), viewerId: "sam", homeOf: () => "EUR", base: "EUR", rateFor: rate });
    expect(isAllSettled(afterPaying(lines, rows))).toBe(true);
  });

  it("is empty when everyone is square", () => {
    expect(settle(computeBalances([]))).toEqual([]);
  });
});
