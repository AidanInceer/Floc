import { describe, expect, it } from "vitest";

import { readCheckoutRequest } from "@/server/billing/checkout-request";

const NOW = new Date("2026-11-08T10:00:00Z");

describe("readCheckoutRequest (#523)", () => {
  it("takes each of the three plans with the consent ticked", () => {
    for (const interval of ["monthly", "quarterly", "yearly"]) {
      expect(readCheckoutRequest({ interval, consent: "yes" }, NOW)).toEqual({ interval, consentAt: NOW });
    }
  });

  it("refuses without the 14-day consent", () => {
    expect(readCheckoutRequest({ interval: "monthly", consent: "no" }, NOW)).toEqual({
      refusal: "Tick the box to start Pro straight away.",
    });
    expect(readCheckoutRequest({ interval: "monthly" }, NOW)).toHaveProperty("refusal");
  });

  it("refuses a plan Floc does not sell", () => {
    expect(readCheckoutRequest({ interval: "weekly", consent: "yes" }, NOW)).toEqual({ refusal: "Pick a plan." });
    expect(readCheckoutRequest(null, NOW)).toEqual({ refusal: "Pick a plan." });
  });
});
