import { describe, expect, it } from "vitest";

import { BILLING_INTERVALS } from "./plans";
import { planOffer } from "./plan-offer";

const MONTHLY = 399;

describe("planOffer (#523)", () => {
  it("offers three periods: a month, 3 months, a year", () => {
    expect(BILLING_INTERVALS).toEqual(["monthly", "quarterly", "yearly"]);
  });

  it("shows the monthly charge alone", () => {
    expect(planOffer({ interval: "monthly", amountMinor: 399, currency: "GBP" }, MONTHLY)).toEqual({
      label: "Monthly",
      charge: "£3.99",
      per: "a month",
      perMonth: null,
      saving: null,
    });
  });

  it("puts the real charge first, then a per-month figure and the exact saving a year", () => {
    expect(planOffer({ interval: "quarterly", amountMinor: 899, currency: "GBP" }, MONTHLY)).toEqual({
      label: "Every 3 months",
      charge: "£8.99",
      per: "every 3 months",
      perMonth: "£3.00 a month",
      saving: "Save £11.92 a year",
    });
    expect(planOffer({ interval: "yearly", amountMinor: 2999, currency: "GBP" }, MONTHLY)).toEqual({
      label: "Yearly",
      charge: "£29.99",
      per: "a year",
      perMonth: "£2.50 a month",
      saving: "Save £17.89 a year",
    });
  });

  it("never says quarterly", () => {
    const words = JSON.stringify(planOffer({ interval: "quarterly", amountMinor: 899, currency: "GBP" }, MONTHLY));
    expect(words.toLowerCase()).not.toContain("quarter");
  });

  it("boasts no saving when there is none, or when the monthly price is unknown", () => {
    expect(planOffer({ interval: "yearly", amountMinor: 399 * 12, currency: "GBP" }, MONTHLY).saving).toBeNull();
    expect(planOffer({ interval: "yearly", amountMinor: 9999, currency: "GBP" }, MONTHLY).saving).toBeNull();
    expect(planOffer({ interval: "yearly", amountMinor: 2999, currency: "GBP" }, null).saving).toBeNull();
  });
});
