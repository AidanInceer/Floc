import type { BillingStatus } from "@floc/api/port";
import { describe, expect, it } from "vitest";

import { claimOf, offerTokenOf, proView, yearlySavingOf } from "./pro";

const NOW = new Date("2026-09-12T12:00:00Z");

const status = (subscription: BillingStatus["subscription"], selling = true): BillingStatus => ({
  selling,
  accountToken: "token",
  subscription,
});

const row = (over: Partial<NonNullable<BillingStatus["subscription"]>> = {}) => ({
  status: "active",
  source: "app_store",
  storeProductId: "floc_pro_yearly",
  currentPeriodEnd: "2026-10-01T00:00:00.000Z",
  cancelAtPeriodEnd: false,
  ...over,
});

describe("what the Pro block shows", () => {
  it("shows nothing while every feature is free", () => {
    expect(proView(status(row(), false), NOW)).toEqual({ kind: "hidden" });
  });

  it("offers Pro to somebody on the free plan", () => {
    expect(proView(status(null), NOW)).toEqual({ kind: "free", line: null });
  });

  it("says a lapsed subscription has ended, and offers Pro again", () => {
    const view = proView(status(row({ currentPeriodEnd: "2026-09-01T00:00:00.000Z" })), NOW);
    expect(view).toEqual({ kind: "free", line: "Your Pro access has ended." });
  });

  it("names the renewal date and the store for a live store subscription", () => {
    const view = proView(status(row()), NOW);
    expect(view.kind).toBe("pro");
    expect(view).toMatchObject({ manage: "app_store" });
    expect(view.kind === "pro" && view.line.startsWith("Renews")).toBe(true);
  });

  it("says ends, not renews, once cancelled", () => {
    const view = proView(status(row({ cancelAtPeriodEnd: true, source: "play" })), NOW);
    expect(view).toMatchObject({ kind: "pro", manage: "play" });
    expect(view.kind === "pro" && view.line.startsWith("Ends")).toBe(true);
  });

  it("points a web subscriber elsewhere without a link, and a comp nowhere", () => {
    expect(proView(status(row({ source: "stripe" })), NOW)).toMatchObject({ manage: "elsewhere" });
    expect(
      proView(status(row({ source: "comp", currentPeriodEnd: null })), NOW),
    ).toEqual({ kind: "pro", line: "Never expires.", manage: "none" });
  });
});

describe("turning a store purchase into a claim", () => {
  it("sends the product and the token", () => {
    expect(claimOf({ productId: "floc_pro_monthly", purchaseToken: "jws" }, "ios")).toEqual({
      platform: "ios",
      productId: "floc_pro_monthly",
      token: "jws",
    });
  });

  it("sends nothing for a purchase with no token or a product Floc does not sell", () => {
    expect(claimOf({ productId: "floc_pro_monthly", purchaseToken: null }, "android")).toBeNull();
    expect(claimOf({ productId: "coins_100", purchaseToken: "t" }, "android")).toBeNull();
  });
});

describe("buying on Play", () => {
  it("uses the first offer that carries a token", () => {
    expect(
      offerTokenOf({ subscriptionOffers: [{ offerTokenAndroid: null }, { offerTokenAndroid: "base" }] }),
    ).toBe("base");
  });

  it("has nothing to offer without one", () => {
    expect(offerTokenOf({ subscriptionOffers: null })).toBeNull();
    expect(offerTokenOf(undefined)).toBeNull();
  });
});

describe("the yearly saving", () => {
  it("compares twelve months with a year, in whole percent", () => {
    expect(yearlySavingOf({ price: 3.99 }, { price: 29.99 })).toBe(37);
  });

  it("boasts of nothing when a price is missing", () => {
    expect(yearlySavingOf(undefined, { price: 29.99 })).toBeNull();
    expect(yearlySavingOf({ price: null }, { price: 29.99 })).toBeNull();
  });
});
