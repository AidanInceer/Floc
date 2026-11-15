import { describe, expect, it } from "vitest";

import { spentByLine } from "./spent";

const expense = (id: number, category: string, currency = "GBP") => ({ id, category, currency }) as never;

describe("spentByLine", () => {
  it("adds only the viewer's share, filed by line", () => {
    const spent = spentByLine({
      expenses: [expense(1, "flights"), expense(2, "lodging"), expense(3, "drinks")],
      splits: [
        { expenseId: 1, userId: "me", owedAmountMinor: 14200 },
        { expenseId: 1, userId: "jo", owedAmountMinor: 14200 },
        { expenseId: 2, userId: "me", owedAmountMinor: 9800 },
        { expenseId: 3, userId: "jo", owedAmountMinor: 1200 },
      ],
      viewerId: "me",
      home: "GBP",
      toHome: {},
    });
    expect(spent.byLine).toEqual({ flights: 14200, stay: 9800, food: 0, activities: 0, transport: 0, other: 0 });
    expect(spent.total).toBe(24000);
    expect(spent.unconverted).toBe(false);
  });

  it("converts another currency to home, and puts uncategorised spend under other", () => {
    const spent = spentByLine({
      expenses: [expense(1, "shopping", "EUR")],
      splits: [{ expenseId: 1, userId: "me", owedAmountMinor: 1000 }],
      viewerId: "me",
      home: "GBP",
      toHome: { EUR: 0.85 },
    });
    expect(spent.byLine.other).toBe(850);
  });

  it("leaves out a share it cannot convert, and says so", () => {
    const spent = spentByLine({
      expenses: [expense(1, "food", "JPY")],
      splits: [{ expenseId: 1, userId: "me", owedAmountMinor: 5000 }],
      viewerId: "me",
      home: "GBP",
      toHome: {},
    });
    expect(spent.total).toBe(0);
    expect(spent.unconverted).toBe(true);
  });
});
