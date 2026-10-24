import { describe, expect, it } from "vitest";

import type { SettleRow } from "./group-settle";
import { positionLines, yourPosition } from "./position";

const row = (payer: string, payee: string, amountMinor: number, currency: "GBP" | "EUR" = "GBP"): SettleRow => ({
  payer,
  payee,
  currency,
  amountMinor,
  netted: false,
  parts: [],
});

describe("yourPosition", () => {
  it("is square when none of the rows are the viewer's", () => {
    expect(yourPosition([row("jo", "sam", 500)], "me")).toEqual({ kind: "square" });
  });

  it("adds what you are owed and takes off what you owe", () => {
    expect(yourPosition([row("me", "priya", 3682), row("sofia", "me", 1000), row("sofia", "priya", 8033)], "me")).toEqual({
      kind: "net",
      currency: "GBP",
      amountMinor: -2682,
    });
  });

  it("is square when what you owe and are owed cancel out", () => {
    expect(yourPosition([row("me", "sam", 1000), row("jo", "me", 1000)], "me")).toEqual({ kind: "square" });
  });

  it("keeps one row per currency when the rows came without a rate", () => {
    expect(yourPosition([row("me", "priya", 12000, "GBP"), row("priya", "me", 10000, "EUR")], "me")).toEqual({
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

  it("names the side, with no mark on a converted figure", () => {
    expect(positionLines({ kind: "net", currency: "GBP", amountMinor: -3500 })).toEqual([
      { label: "You owe", figure: "£35.00" },
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
