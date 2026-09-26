import { describe, expect, it } from "vitest";

import { landingFaq } from "./faq";

describe("landingFaq", () => {
  it("distinguishes what Pro offers now from what is still to come", () => {
    const pro = landingFaq({ sellingPro: true, monthly: "£3.99" }).find((q) => q.key === "pro");
    expect(pro?.answer).toMatch(/Today, Pro adds/);
    expect(pro?.answer).toMatch(/there’s plenty more to come/i);
  });

  it("quotes the Pro price when Stripe has one", () => {
    const pro = landingFaq({ sellingPro: true, monthly: "£3.99" }).find((q) => q.key === "pro");
    expect(pro?.answer).toContain("£3.99 a month");
  });

  it("sells Pro without a figure when the price cannot be read", () => {
    const pro = landingFaq({ sellingPro: true, monthly: null }).find((q) => q.key === "pro");
    expect(pro?.answer).not.toMatch(/a month/);
  });

  it("leaves Pro out when every feature is free", () => {
    const keys = landingFaq({ sellingPro: false, monthly: null }).map((q) => q.key);
    expect(keys).not.toContain("pro");
  });

  it("does not promise everything is free while Pro is on sale", () => {
    const free = landingFaq({ sellingPro: true, monthly: null }).find((q) => q.key === "free");
    expect(free?.answer).toMatch(/Pro/);
  });
});
