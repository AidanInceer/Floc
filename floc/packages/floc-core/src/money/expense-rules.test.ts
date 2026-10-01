import { describe, expect, it } from "vitest";

import { expenseFieldsProblem, expenseProblem, transferPartiesProblem, type ExpenseDraft } from "./expense-rules";

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

describe("an expense's own fields", () => {
  const fields = { description: "Dinner", paidBy: "ada", currency: "GBP" };

  it("passes when everything is filled in", () => {
    expect(expenseFieldsProblem(fields)).toBeNull();
  });

  it.each([
    ["no description", { description: "" }, "Give the expense a description."],
    ["no payer", { paidBy: "" }, "Say who paid."],
    ["an unknown currency", { currency: "XXX" }, "Pick a currency."],
  ])("refuses %s", (_, patch, message) => {
    expect(expenseFieldsProblem({ ...fields, ...patch })).toBe(message);
  });
});

describe("who a settlement may be between", () => {
  const trip = new Set(["ada", "mo", "kim"]);

  it("passes for two members when the viewer is one of them", () => {
    expect(transferPartiesProblem(trip, "ada", "mo", "ada")).toBeNull();
  });

  it("refuses a person settling with themselves", () => {
    expect(transferPartiesProblem(trip, "ada", "ada", "ada")).toMatchObject({ message: "A settlement is between two different people.", kind: "invalid" });
  });

  it("refuses someone who is not on the trip", () => {
    expect(transferPartiesProblem(trip, "ada", "ada", "zed")).toMatchObject({ message: "Both people must be on the trip.", kind: "invalid" });
  });

  it("refuses a viewer who is neither side", () => {
    expect(transferPartiesProblem(trip, "kim", "ada", "mo")).toMatchObject({ message: "Only the payer or receiver can record this.", kind: "forbidden" });
  });
});
