import { describe, expect, it } from "vitest";

import { BILLING_INTERVALS, FEATURE_PLAN, planMeets } from "./plans";

describe("BILLING_INTERVALS", () => {
  it("sells a month, 3 months and a year, shortest first (#523)", () => {
    expect(BILLING_INTERVALS).toEqual(["monthly", "quarterly", "yearly"]);
  });
});

describe("FEATURE_PLAN", () => {
  it("makes every Pro feature follow the person, never the trip (#523, ADR-041)", () => {
    for (const rule of Object.values(FEATURE_PLAN)) expect(rule).toEqual({ plan: "pro" });
  });

  it("gates no filled-in booking search, which is free for everyone (#716)", () => {
    expect(Object.keys(FEATURE_PLAN)).not.toContain("booking.prefill");
  });
});

describe("planMeets", () => {
  it("lets Pro reach a free feature and not the other way round", () => {
    expect(planMeets("pro", "free")).toBe(true);
    expect(planMeets("free", "pro")).toBe(false);
  });
});
