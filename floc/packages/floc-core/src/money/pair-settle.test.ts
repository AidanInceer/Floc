import { describe, expect, it } from "vitest";

import { pairSettleUp } from "./pair-settle";
import type { CurrencyTransfer } from "./settle-up";

const gbpBase = (c: string) => (c === "GBP" ? 1 : c === "EUR" ? 0.85 : null);
const homes: Record<string, "GBP" | "EUR"> = { me: "GBP", priya: "EUR", sam: "GBP" };
const homeOf = (id: string) => homes[id] ?? "GBP";

describe("pairSettleUp", () => {
  it("passes a single debt in one currency straight through", () => {
    const transfers: CurrencyTransfer[] = [{ from: "me", to: "sam", amountMinor: 1000, currency: "GBP" }];
    expect(pairSettleUp({ transfers, viewerId: "me", homeOf, rateFor: gbpBase })).toEqual([
      { other: "sam", payer: "me", payee: "sam", currency: "GBP", amountMinor: 1000, netted: false, parts: [{ fromUserId: "me", toUserId: "sam", amountMinor: 1000, currency: "GBP" }] },
    ]);
  });

  it("nets two currencies between the same two people into one payment, in the payer's home currency", () => {
    const transfers: CurrencyTransfer[] = [
      { from: "me", to: "sam", amountMinor: 12000, currency: "GBP" },
      { from: "sam", to: "me", amountMinor: 1000, currency: "EUR" },
    ];
    const [row] = pairSettleUp({ transfers, viewerId: "me", homeOf, rateFor: gbpBase });
    expect(row).toMatchObject({ other: "sam", payer: "me", payee: "sam", currency: "GBP", amountMinor: 12000 - 850, netted: true });
    expect(row.parts).toEqual([
      { fromUserId: "me", toUserId: "sam", amountMinor: 12000, currency: "GBP" },
      { fromUserId: "sam", toUserId: "me", amountMinor: 850, currency: "GBP", clearsAmountMinor: 1000, clearsCurrency: "EUR", fxRate: 1 / 0.85 },
    ]);
  });

  it("uses the other person's home currency when they are the one who pays", () => {
    const transfers: CurrencyTransfer[] = [
      { from: "priya", to: "me", amountMinor: 8500, currency: "GBP" },
      { from: "me", to: "priya", amountMinor: 1000, currency: "EUR" },
    ];
    const [row] = pairSettleUp({ transfers, viewerId: "me", homeOf, rateFor: gbpBase });
    expect(row).toMatchObject({ payer: "priya", payee: "me", currency: "EUR", amountMinor: 10000 - 1000, netted: true });
  });

  it("leaves each currency on its own row when a rate is missing (rule 11)", () => {
    const transfers: CurrencyTransfer[] = [
      { from: "me", to: "sam", amountMinor: 12000, currency: "GBP" },
      { from: "sam", to: "me", amountMinor: 1000, currency: "EUR" },
    ];
    const rows = pairSettleUp({ transfers, viewerId: "me", homeOf, rateFor: () => null });
    expect(rows.map((r) => [r.payer, r.currency, r.amountMinor, r.netted])).toEqual([
      ["me", "GBP", 12000, false],
      ["sam", "EUR", 1000, false],
    ]);
  });

  it("ignores transfers the viewer is not in", () => {
    const transfers: CurrencyTransfer[] = [{ from: "sam", to: "priya", amountMinor: 500, currency: "GBP" }];
    expect(pairSettleUp({ transfers, viewerId: "me", homeOf, rateFor: gbpBase })).toEqual([]);
  });
});
