import { describe, expect, it } from "vitest";

import { spendHeadline, spendNote } from "./spend";

describe("spendNote", () => {
  it("says so when nothing is logged", () => {
    expect(spendNote(0, null)).toBe("Nothing logged yet");
  });

  it("counts expenses, and the ones in other currencies", () => {
    expect(spendNote(1, { currency: "GBP", total: 100, otherCurrencies: 0 })).toBe("1 expense");
    expect(spendNote(3, { currency: "GBP", total: 100, otherCurrencies: 1 })).toBe(
      "3 expenses, plus 1 in other currencies",
    );
  });
});

describe("spendHeadline", () => {
  it("is nothing with nothing logged", () => {
    expect(spendHeadline([])).toBeNull();
  });

  it("totals the currency with the most expenses and counts the rest", () => {
    expect(
      spendHeadline([
        { currency: "GBP", amountMinor: 30000 },
        { currency: "GBP", amountMinor: 18000 },
        { currency: "EUR", amountMinor: 5000 },
      ]),
    ).toEqual({ currency: "GBP", total: 48000, otherCurrencies: 1 });
  });
});
