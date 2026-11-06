import { expect, it } from "vitest";
import { editStart, peopleOnExpense } from "./edit-start";
import { previewExpenseSplit } from "./expense-preview";

it("an unchanged edit preserves unequal debts and a former participant", () => {
  const expense = { paidBy: "gone", splits: [{ userId: "a", owedAmountMinor: 6000 }, { userId: "gone", owedAmountMinor: 3000 }] };
  const people = peopleOnExpense([{ userId: "a", name: "Ada" }], expense, () => "Former member");
  const start = editStart(expense.splits, "GBP");
  const preview = previewExpenseSplit("90.00", people.map((p) => ({ userId: p.userId, shares: 1, pin: start.weights[p.userId] })), "GBP");
  expect(start.mode).toBe("exact");
  expect(preview.amounts).toEqual({ a: 6000, gone: 3000 });
  expect(preview.leftover).toBe(0);
});
