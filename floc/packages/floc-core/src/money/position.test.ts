import { describe, expect, it } from "vitest";

import { computeBalances } from "./money";
import { positionLines, yourPosition } from "./position";

const noRates = () => null;
const eurInGbp = (c: string) => (c === "EUR" ? 0.85 : null);

function balances(entries: { currency: "GBP" | "EUR"; paidBy: string; owed: Record<string, number> }[]) {
  return computeBalances(
    entries.map((e) => ({
      paidBy: e.paidBy,
      currency: e.currency,
      amountMinor: Object.values(e.owed).reduce((a, b) => a + b, 0),
      splits: Object.entries(e.owed).map(([userId, owedAmountMinor]) => ({ userId, owedAmountMinor })),
    })),
  );
}

describe("yourPosition", () => {
  it("is square when the viewer is in no balance", () => {
    const b = balances([{ currency: "GBP", paidBy: "sam", owed: { sam: 500, jo: 500 } }]);
    expect(yourPosition({ balances: b, viewerId: "me", home: "GBP", rateFor: noRates })).toEqual({ kind: "square" });
  });

  it("nets what you owe against what you are owed in your home currency", () => {
    const b = balances([
      { currency: "GBP", paidBy: "sam", owed: { sam: 1000, me: 1000 } },
      { currency: "GBP", paidBy: "me", owed: { me: 400, sam: 400 } },
    ]);
    expect(yourPosition({ balances: b, viewerId: "me", home: "GBP", rateFor: noRates })).toEqual({
      kind: "net",
      currency: "GBP",
      amountMinor: -600,
      approx: false,
    });
  });

  it("is square when what you owe and are owed cancel out", () => {
    const b = balances([
      { currency: "GBP", paidBy: "sam", owed: { sam: 1000, me: 1000 } },
      { currency: "GBP", paidBy: "me", owed: { me: 1000, sam: 1000 } },
    ]);
    expect(yourPosition({ balances: b, viewerId: "me", home: "GBP", rateFor: noRates })).toEqual({ kind: "square" });
  });

  it("converts other currencies into your home currency, marked approximate", () => {
    const b = balances([
      { currency: "GBP", paidBy: "priya", owed: { priya: 12000, me: 12000 } },
      { currency: "EUR", paidBy: "me", owed: { me: 10000, priya: 10000 } },
    ]);
    expect(yourPosition({ balances: b, viewerId: "me", home: "GBP", rateFor: eurInGbp })).toEqual({
      kind: "net",
      currency: "GBP",
      amountMinor: -12000 + 8500,
      approx: true,
    });
  });

  it("keeps one row per currency when a rate is missing", () => {
    const b = balances([
      { currency: "GBP", paidBy: "priya", owed: { priya: 12000, me: 12000 } },
      { currency: "EUR", paidBy: "me", owed: { me: 10000, priya: 10000 } },
    ]);
    expect(yourPosition({ balances: b, viewerId: "me", home: "GBP", rateFor: noRates })).toEqual({
      kind: "per-currency",
      rows: [
        { currency: "EUR", amountMinor: 10000 },
        { currency: "GBP", amountMinor: -12000 },
      ],
    });
  });
});

describe("positionLines", () => {
  it("says all square with no figure", () => {
    expect(positionLines({ kind: "square" })).toEqual([{ label: "All square", figure: null }]);
  });

  it("names the side and marks a converted figure approximate", () => {
    expect(positionLines({ kind: "net", currency: "GBP", amountMinor: -3500, approx: true })).toEqual([
      { label: "You owe", figure: "≈ £35.00" },
    ]);
  });

  it("gives one line per currency when they cannot be added", () => {
    expect(
      positionLines({
        kind: "per-currency",
        rows: [
          { currency: "EUR", amountMinor: 340 },
          { currency: "GBP", amountMinor: -12000 },
        ],
      }).map((l) => l.label),
    ).toEqual(["You are owed", "You owe"]);
  });
});
