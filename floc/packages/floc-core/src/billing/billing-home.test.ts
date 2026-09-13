import { describe, expect, it } from "vitest";

import { billingHome } from "./billing-home";

describe("where a subscription is managed", () => {
  it("sends a store purchase back to its own store", () => {
    expect(billingHome("app_store")).toBe("app_store");
    expect(billingHome("play")).toBe("play");
  });

  it("keeps a Stripe subscription on the web", () => {
    expect(billingHome("stripe")).toBe("web");
  });

  it("gives a comp nowhere to manage, because nothing is billed", () => {
    expect(billingHome("comp")).toBe("none");
  });
});
