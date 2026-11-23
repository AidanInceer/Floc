import type { BillingStatus } from "@floc/api/port";
import { STORE_PRODUCT_IDS } from "@floc/core/billing/store-products";
import { describe, expect, it } from "vitest";

import { claimOf, offerTokenOf, proView, storeOffers } from "./pro";

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

describe("the store's offers", () => {
  const month = { id: STORE_PRODUCT_IDS.monthly, displayPrice: "£3.99", price: 3.99 };
  const quarter = { id: STORE_PRODUCT_IDS.quarterly, displayPrice: "£8.99", price: 8.99 };
  const year = { id: STORE_PRODUCT_IDS.yearly, displayPrice: "£29.99", price: 29.99 };

  it("leads with the year, then 3 months, then the month, each with its saving (#523)", () => {
    expect(storeOffers([month, quarter, year]).map(({ label, lead }) => [label, lead])).toEqual([
      ["£29.99 a year · save 37%", true],
      ["£8.99 every 3 months · save 25%", false],
      ["£3.99 a month", false],
    ]);
  });

  it("boasts of nothing when the month's price is missing", () => {
    expect(storeOffers([quarter, year]).map((o) => o.label)).toEqual(["£29.99 a year", "£8.99 every 3 months"]);
    expect(storeOffers([{ ...month, price: null }, year]).map((o) => o.label)).toEqual(["£29.99 a year", "£3.99 a month"]);
  });

  it("leads with the plan that saves the most, as the web's best value does (#523)", () => {
    const cheapQuarter = { ...quarter, displayPrice: "£5.99", price: 5.99 };
    const leads = storeOffers([month, cheapQuarter, year]).filter((o) => o.lead).map((o) => o.product.id);
    expect(leads).toEqual([STORE_PRODUCT_IDS.quarterly]);
  });

  it("offers nothing Google Play could not find, so no button ever lacks a price (#523)", () => {
    const notFound = { id: STORE_PRODUCT_IDS.yearly, displayPrice: "", price: null };
    expect(storeOffers([notFound])).toEqual([]);
    expect(storeOffers([notFound, month]).map(({ label, lead }) => [label, lead])).toEqual([["£3.99 a month", true]]);
  });

  it("offers only what the store sells, and leads with the first", () => {
    expect(storeOffers([month]).map(({ label, lead }) => [label, lead])).toEqual([["£3.99 a month", true]]);
    expect(storeOffers([])).toEqual([]);
  });
});
