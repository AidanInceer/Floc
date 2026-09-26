import { describe, expect, it } from "vitest";

import { expenseProblem, type ExpenseDraft } from "./expense-rules";

const people = new Set(["ada", "mo"]);

const draft = (patch: Partial<ExpenseDraft> = {}): ExpenseDraft => ({
  paidBy: "ada",
  amountMinor: 1000,
  currency: "GBP",
  splits: [
    { userId: "ada", owedAmountMinor: 500 },
    { userId: "mo", owedAmountMinor: 500 },
  ],
  ...patch,
});

describe("an expense that may be written", () => {
  it("passes when the shares add up and everyone is on the trip", () => {
    expect(expenseProblem(draft(), people)).toBeNull();
  });

  it("refuses an amount of nothing", () => {
    expect(expenseProblem(draft({ amountMinor: 0, splits: [] }), people)).toMatch(/above zero/);
  });

  it("refuses an amount past the cap", () => {
    const huge = 1_000_000_01;
    expect(
      expenseProblem(draft({ amountMinor: huge, splits: [{ userId: "ada", owedAmountMinor: huge }] }), people),
    ).toMatch(/Keep an expense under/);
  });

  it("refuses a payer who is not on the trip", () => {
    expect(expenseProblem(draft({ paidBy: "stranger" }), people)).toMatch(/payer/);
  });

  it("refuses a share for somebody who is not on the trip", () => {
    const splits = [
      { userId: "ada", owedAmountMinor: 500 },
      { userId: "stranger", owedAmountMinor: 500 },
    ];
    expect(expenseProblem(draft({ splits }), people)).toMatch(/on the trip/);
  });

  it("refuses a negative share, even when the total still adds up", () => {
    const splits = [
      { userId: "ada", owedAmountMinor: 1500 },
      { userId: "mo", owedAmountMinor: -500 },
    ];
    expect(expenseProblem(draft({ splits }), people)).toMatch(/negative/);
  });

  it("refuses shares that do not add up to the total", () => {
    const splits = [
      { userId: "ada", owedAmountMinor: 500 },
      { userId: "mo", owedAmountMinor: 400 },
    ];
    expect(expenseProblem(draft({ splits }), people)).toMatch(/add up/);
  });

  it("refuses the same person twice", () => {
    const splits = [
      { userId: "ada", owedAmountMinor: 500 },
      { userId: "ada", owedAmountMinor: 500 },
    ];
    expect(expenseProblem(draft({ splits }), people)).toMatch(/once/);
  });

  it("refuses an expense nobody owes", () => {
    expect(expenseProblem(draft({ splits: [] }), people)).toMatch(/Somebody/);
  });
});
