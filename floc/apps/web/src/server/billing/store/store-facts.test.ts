import { describe, expect, it } from "vitest";

import { appleFacts, playFacts } from "@/server/billing/store/store-facts";

const END = Date.UTC(2026, 9, 1);

const tx = {
  originalTransactionId: "2000000111",
  productId: "floc_pro_yearly",
  expiresDate: END,
  appAccountToken: "token-1",
};

describe("an App Store transaction", () => {
  it("reads as a live subscription that renews", () => {
    expect(appleFacts(tx)).toEqual({
      storeTransactionId: "2000000111",
      productId: "floc_pro_yearly",
      status: "active",
      currentPeriodEnd: new Date(END),
      cancelAtPeriodEnd: false,
      accountToken: "token-1",
    });
  });

  it("ends rather than renews once auto-renew is switched off", () => {
    expect(appleFacts(tx, { autoRenewStatus: 0 })?.cancelAtPeriodEnd).toBe(true);
  });

  it("keeps Pro through a billing grace period", () => {
    expect(appleFacts(tx, null, 4)?.status).toBe("active");
  });

  it("is past due while Apple retries a failed payment", () => {
    expect(appleFacts(tx, null, 3)?.status).toBe("past_due");
  });

  it("is over when expired or revoked", () => {
    expect(appleFacts(tx, null, 2)?.status).toBe("canceled");
    expect(appleFacts(tx, null, 5)?.status).toBe("canceled");
  });

  it("is over when refunded, whatever the status says", () => {
    expect(appleFacts({ ...tx, revocationDate: END - 1 }, null, 1)?.status).toBe("canceled");
  });

  it("is nothing without the ids it is keyed on", () => {
    expect(appleFacts({ ...tx, originalTransactionId: undefined })).toBeNull();
    expect(appleFacts({ ...tx, productId: undefined })).toBeNull();
  });

  it("is nothing without an end date, which would otherwise read as Pro for ever", () => {
    expect(appleFacts({ ...tx, expiresDate: undefined })).toBeNull();
  });

  it("has no account token when Apple sends none", () => {
    expect(appleFacts({ ...tx, appAccountToken: undefined })?.accountToken).toBeNull();
  });

  it("does not guess at a status it has never seen", () => {
    expect(appleFacts(tx, null, 99)?.status).toBe("incomplete");
  });
});

const play = {
  subscriptionState: "SUBSCRIPTION_STATE_ACTIVE",
  lineItems: [
    {
      productId: "floc_pro_monthly",
      expiryTime: "2026-10-01T00:00:00Z",
      autoRenewingPlan: { autoRenewEnabled: true },
    },
  ],
  externalAccountIdentifiers: { obfuscatedExternalAccountId: "token-2" },
};

describe("a Google Play subscription", () => {
  it("reads as a live subscription that renews", () => {
    expect(playFacts("purchase-token", play)).toEqual({
      storeTransactionId: "purchase-token",
      productId: "floc_pro_monthly",
      status: "active",
      currentPeriodEnd: new Date("2026-10-01T00:00:00Z"),
      cancelAtPeriodEnd: false,
      accountToken: "token-2",
    });
  });

  it("stays Pro but ends when cancelled, because Google keeps it paid up", () => {
    const facts = playFacts("t", { ...play, subscriptionState: "SUBSCRIPTION_STATE_CANCELED" });
    expect(facts?.status).toBe("active");
    expect(facts?.cancelAtPeriodEnd).toBe(true);
  });

  it("ends when auto-renew is off on the plan", () => {
    const facts = playFacts("t", {
      ...play,
      lineItems: [{ ...play.lineItems[0], autoRenewingPlan: { autoRenewEnabled: false } }],
    });
    expect(facts?.cancelAtPeriodEnd).toBe(true);
  });

  it.each([
    ["SUBSCRIPTION_STATE_IN_GRACE_PERIOD", "active"],
    ["SUBSCRIPTION_STATE_ON_HOLD", "past_due"],
    ["SUBSCRIPTION_STATE_PAUSED", "paused"],
    ["SUBSCRIPTION_STATE_PENDING", "incomplete"],
    ["SUBSCRIPTION_STATE_EXPIRED", "canceled"],
    ["SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED", "canceled"],
    ["SUBSCRIPTION_STATE_UNSPECIFIED", "incomplete"],
  ])("maps %s to %s", (state, status) => {
    expect(playFacts("t", { ...play, subscriptionState: state })?.status).toBe(status);
  });

  it("is nothing without a product on it", () => {
    expect(playFacts("t", { ...play, lineItems: [] })).toBeNull();
  });

  it("is nothing without an end date, which would otherwise read as Pro for ever", () => {
    expect(playFacts("t", { lineItems: [{ productId: "p" }] })).toBeNull();
  });

  it("has no account token when Google sends none", () => {
    const facts = playFacts("t", { lineItems: [{ productId: "p", expiryTime: "2026-10-01T00:00:00Z" }] });
    expect(facts?.accountToken).toBeNull();
    expect(facts?.status).toBe("incomplete");
  });
});
