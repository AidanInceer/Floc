import { describe, expect, it } from "vitest";

import { leftToSortFrom } from "./left-to-sort-from";

describe("leftToSortFrom", () => {
  it("reads what you owe from the ledger, names the person, and counts claimed packing as sorted", () => {
    const result = leftToSortFrom({
      trip: { startDate: "2026-11-01", endDate: "2026-11-05" },
      today: "2026-10-24",
      viewerId: "me",
      members: [{ userId: "me", name: "Dev" }, { userId: "priya", name: "Priya" }],
      markedUserIds: [],
      ideas: [],
      ledger: {
        expenses: [{ id: 1, paidBy: "priya", currency: "GBP", amountMinor: 24000 }],
        splits: [{ expenseId: 1, userId: "me", owedAmountMinor: 12000 }, { expenseId: 1, userId: "priya", owedAmountMinor: 12000 }],
        settlements: [],
      },
      shared: [{ label: "Towels", claimed: true }],
      legs: [{ no: 1, placeName: "Lisbon, Portugal", arrive: "2026-11-01", leave: "2026-11-05", nights: 4, stay: null, mode: null }],
    });
    expect(result.open.map((g) => g.text)).toEqual(["You owe Priya £120.00", "No stay booked in Lisbon"]);
    expect(result.sorted).toBe(1);
  });
});
