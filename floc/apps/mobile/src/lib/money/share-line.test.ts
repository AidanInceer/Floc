import { describe, expect, it } from "vitest";

import { shareLine } from "./share-line";

const dinner = { paidBy: "me", amountMinor: 16350, currency: "EUR" as const };

describe("shareLine", () => {
  it("says what you lent when you paid", () => {
    expect(shareLine(dinner, "me", 3270)).toEqual({ words: "You lent €130.80", tone: "lent" });
  });

  it("says your share when someone else paid", () => {
    expect(shareLine({ ...dinner, paidBy: "priya" }, "me", 3270)).toEqual({ words: "Your share €32.70", tone: "share" });
  });

  it("says you are not in it when you have no share", () => {
    expect(shareLine({ ...dinner, paidBy: "priya" }, "me", undefined)).toEqual({ words: "Not yours", tone: "none" });
  });

  it("says nothing lent when you paid only your own share", () => {
    expect(shareLine({ ...dinner, amountMinor: 3270 }, "me", 3270)).toEqual({ words: "Your share €32.70", tone: "share" });
  });
});
