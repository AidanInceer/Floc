import { describe, expect, it } from "vitest";
import { editStart, peopleOnExpense } from "./edit-start";
import { previewExpenseSplit } from "./expense/expense-preview";

it("an unchanged edit preserves unequal debts and a former participant", () => {
  const expense = { paidBy: "gone", splits: [{ userId: "a", owedAmountMinor: 6000 }, { userId: "gone", owedAmountMinor: 3000 }] };
  const people = peopleOnExpense([{ userId: "a", name: "Ada" }], expense, () => "Former member");
  const start = editStart(expense.splits, "GBP");
  const preview = previewExpenseSplit("90.00", people.map((p) => ({ userId: p.userId, shares: 1, pin: start.weights[p.userId] })), "GBP");
  expect(start.mode).toBe("exact");
  expect(preview.amounts).toEqual({ a: 6000, gone: 3000 });
  expect(preview.leftover).toBe(0);
});

describe("where an edit starts", () => {
  it("opens an even split as Equally, with the same people in", () => {
    const start = editStart(
      [
        { userId: "ada", owedAmountMinor: 500 },
        { userId: "mo", owedAmountMinor: 500 },
        { userId: "sam", owedAmountMinor: 0 },
      ],
      "GBP",
    );
    expect(start.mode).toBe("equally");
    expect(start.inOn.sort()).toEqual(["ada", "mo"]);
  });

  it("opens an uneven split as Exact, with each figure kept", () => {
    const start = editStart(
      [
        { userId: "ada", owedAmountMinor: 700 },
        { userId: "mo", owedAmountMinor: 301 },
      ],
      "GBP",
    );
    expect(start.mode).toBe("exact");
    expect(start.weights).toEqual({ ada: "7.00", mo: "3.01" });
  });
});

describe("who an edit may name", () => {
  it("keeps somebody who left but is still on the expense", () => {
    const people = peopleOnExpense(
      [{ userId: "ada", name: "Ada" }],
      { paidBy: "gone", splits: [{ userId: "ada" }, { userId: "gone" }] },
      () => "Someone who left",
    );
    expect(people).toEqual([
      { userId: "ada", name: "Ada" },
      { userId: "gone", name: "Someone who left" },
    ]);
  });
});
