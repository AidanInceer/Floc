import { describe, expect, it } from "vitest";

import { yourSettleUp, type CurrencyTransfer } from "./settle-up";

const t = (
  from: string,
  to: string,
  amountMinor: number,
  currency: CurrencyTransfer["currency"] = "EUR",
): CurrencyTransfer => ({ from, to, amountMinor, currency });

describe("yourSettleUp", () => {
  it("splits the transfers into what you owe and what you are owed", () => {
    const mine = yourSettleUp({
      transfers: [t("me", "tom", 4500, "GBP"), t("sofia", "me", 9640)],
      viewerId: "me",
    });

    expect(mine.owe).toEqual([t("me", "tom", 4500, "GBP")]);
    expect(mine.owed).toEqual([t("sofia", "me", 9640)]);
  });

  it("drops transfers between other people", () => {
    const mine = yourSettleUp({
      transfers: [t("priya", "tom", 6030)],
      viewerId: "me",
    });

    expect(mine.owe).toEqual([]);
    expect(mine.owed).toEqual([]);
    expect(mine.settled).toBe(true);
  });

  it("is not settled while one transfer is yours", () => {
    const mine = yourSettleUp({
      transfers: [t("priya", "tom", 6030), t("me", "tom", 100, "GBP")],
      viewerId: "me",
    });

    expect(mine.settled).toBe(false);
  });

  it("orders rows by currency, then biggest first", () => {
    const mine = yourSettleUp({
      transfers: [
        t("priya", "me", 340),
        t("tom", "me", 500, "GBP"),
        t("sofia", "me", 9640),
      ],
      viewerId: "me",
    });

    expect(mine.owed).toEqual([
      t("sofia", "me", 9640),
      t("priya", "me", 340),
      t("tom", "me", 500, "GBP"),
    ]);
  });

  it("totals each side, one row per currency", () => {
    const mine = yourSettleUp({
      transfers: [
        t("priya", "me", 340),
        t("sofia", "me", 9640),
        t("tom", "me", 500, "GBP"),
        t("me", "nadia", 4500, "GBP"),
      ],
      viewerId: "me",
    });

    expect(mine.owedTotals).toEqual([
      { currency: "EUR", amountMinor: 9980 },
      { currency: "GBP", amountMinor: 500 },
    ]);
    expect(mine.oweTotals).toEqual([{ currency: "GBP", amountMinor: 4500 }]);
  });

  it("has no totals for a side with nothing on it", () => {
    const mine = yourSettleUp({
      transfers: [t("sofia", "me", 9640)],
      viewerId: "me",
    });

    expect(mine.oweTotals).toEqual([]);
  });
});
