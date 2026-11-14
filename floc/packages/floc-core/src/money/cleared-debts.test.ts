import { describe, expect, it } from "vitest";

import { clearedDebts } from "./cleared-debts";
import type { SettleRow } from "./group-settle";

const row = (parts: SettleRow["parts"]): SettleRow => ({
  payer: "me",
  payee: "sam",
  currency: "GBP",
  amountMinor: 1000,
  netted: true,
  parts,
});

describe("clearedDebts", () => {
  it("says the viewer owed a debt that runs with the payment", () => {
    const [debt] = clearedDebts(row([{ fromUserId: "me", toUserId: "sam", amountMinor: 1250, currency: "GBP" }]), "me");
    expect(debt).toEqual({ key: "me-GBP", youOwe: true, otherId: "sam", cleared: "£12.50", inPay: null, against: false });
  });

  it("marks a debt the other way as taken off the payment", () => {
    const [, debt] = clearedDebts(
      row([
        { fromUserId: "me", toUserId: "sam", amountMinor: 1250, currency: "GBP" },
        { fromUserId: "sam", toUserId: "me", amountMinor: 250, currency: "GBP" },
      ]),
      "me",
    );
    expect(debt).toMatchObject({ youOwe: false, otherId: "sam", cleared: "£2.50", against: true });
  });

  it("gives the debt in its own currency and what it costs in the payment's", () => {
    const [debt] = clearedDebts(
      row([{ fromUserId: "me", toUserId: "sam", amountMinor: 860, currency: "GBP", clearsAmountMinor: 1000, clearsCurrency: "EUR", fxRate: 1.1628 }]),
      "me",
    );
    expect(debt).toMatchObject({ key: "me-EUR", cleared: "€10.00", inPay: "£8.60" });
  });
});
