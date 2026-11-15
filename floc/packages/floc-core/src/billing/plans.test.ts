import { describe, expect, it } from "vitest";

import { FEATURE_PLAN, planMeets } from "./plans";

describe("FEATURE_PLAN", () => {
  it("makes your cost estimate and budget Pro, and yours alone (#574, ADR-057)", () => {
    expect(FEATURE_PLAN["money.estimate"]).toEqual({ plan: "pro", scope: "user" });
  });
});

describe("planMeets", () => {
  it("lets Pro reach a free feature and not the other way round", () => {
    expect(planMeets("pro", "free")).toBe(true);
    expect(planMeets("free", "pro")).toBe(false);
  });
});
