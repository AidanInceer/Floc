import { describe, expect, it } from "vitest";

import { leftToSortFrom } from "./left-to-sort-from";

describe("leftToSortFrom", () => {
  it("lists what you pay on Money, names the person, and counts claimed packing as sorted", () => {
    const result = leftToSortFrom({
      trip: { startDate: "2026-11-01", endDate: "2026-11-05" },
      today: "2026-10-24",
      viewerId: "me",
      members: [{ userId: "me", name: "Dev" }, { userId: "priya", name: "Priya" }],
      markedUserIds: [],
      ideas: [],
      settle: [
        { payer: "me", payee: "priya", currency: "GBP", amountMinor: 12000, netted: false, parts: [] },
        { payer: "priya", payee: "me", currency: "GBP", amountMinor: 0, netted: false, parts: [] },
      ],
      shared: [{ label: "Towels", claimed: true }],
      legs: [{ no: 1, placeName: "Lisbon, Portugal", arrive: "2026-11-01", leave: "2026-11-05", nights: 4, stay: null, mode: null }],
    });
    expect(result.open.map((g) => g.text)).toEqual(["No stay booked in Lisbon", "You owe Priya £120.00"]);
    expect(result.done.map((d) => d.text)).toEqual(["Towels"]);
  });

  it("stops asking who brings what once the trip is over, and still shows what you owe", () => {
    const result = leftToSortFrom({
      trip: { startDate: "2026-10-24", endDate: "2026-10-30" },
      today: "2026-11-04",
      viewerId: "me",
      members: [{ userId: "me", name: "Dev" }, { userId: "priya", name: "Priya" }],
      markedUserIds: [],
      ideas: [],
      settle: [{ payer: "me", payee: "priya", currency: "GBP", amountMinor: 12000, netted: false, parts: [] }],
      shared: [{ label: "Speaker", claimed: false }, { label: "Towels", claimed: true }],
      legs: [],
    });
    expect(result.open.map((g) => g.text)).toEqual(["You owe Priya £120.00"]);
    expect(result.done).toEqual([]);
  });

  it("still asks who brings what on the trip's last day", () => {
    const result = leftToSortFrom({
      trip: { startDate: "2026-10-24", endDate: "2026-10-30" },
      today: "2026-10-30",
      viewerId: "me",
      members: [{ userId: "me", name: "Dev" }],
      markedUserIds: [],
      ideas: [],
      settle: [],
      shared: [{ label: "Speaker", claimed: false }],
      legs: [],
    });
    expect(result.open.map((g) => g.text)).toEqual(["Speaker is up for grabs"]);
  });
});
