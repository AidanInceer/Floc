import { describe, expect, it } from "vitest";

import { planFor } from "./plan";

const guide = [
  { line: "flights" as const, range: [11000, 19000] as const, route: { from: "LHR", out: "Lisbon", back: "Porto" } },
  { line: "stay" as const, range: [31500, 49000] as const },
  { line: "food" as const, range: [24000, 36000] as const },
  { line: "activities" as const, range: [12000, 24000] as const },
  { line: "transport" as const, range: null, missing: "place" as const },
];
const spent = { flights: 14200, stay: 9800, food: 0, activities: 0, transport: 0, other: 1500 };

describe("planFor", () => {
  it("uses the guide where the member has no figure of their own", () => {
    const plan = planFor({ guide, own: {}, spent, budget: null });
    expect(plan.lines[1]).toMatchObject({ line: "stay", plan: [31500, 49000], own: null, spent: 9800, progress: { kind: "to-go" } });
  });

  it("lets the member's own figure replace the guide", () => {
    const plan = planFor({ guide, own: { stay: { figure: 40000, budget: null } }, spent, budget: null });
    expect(plan.lines[1]).toMatchObject({ plan: [40000, 40000], own: 40000, guide: [31500, 49000] });
    expect(plan.total).toEqual([11000 + 40000 + 24000 + 12000, 19000 + 40000 + 36000 + 24000]);
  });

  it("gives a line with no guide a plan once the member enters a figure", () => {
    const plan = planFor({ guide, own: { transport: { figure: 5000, budget: null } }, spent, budget: null });
    expect(plan.lines[4]).toMatchObject({ plan: [5000, 5000], missing: "place" });
  });

  it("adds an Other row with spend only, so Spent matches Money", () => {
    const plan = planFor({ guide, own: {}, spent, budget: null });
    expect(plan.other).toBe(1500);
    expect(plan.spent).toBe(25500);
  });

  it("fits the budget against the total and keeps each line's own budget", () => {
    const plan = planFor({ guide, own: { food: { figure: null, budget: 30000 } }, spent, budget: 110000 });
    expect(plan.fit).toEqual({ kind: "tight", short: 128000 - 110000 });
    expect(plan.left).toBe(110000 - 25500);
    expect(plan.lines[2].budget).toBe(30000);
  });

  it("has no fit and nothing left without a budget", () => {
    const plan = planFor({ guide, own: {}, spent, budget: null });
    expect(plan.fit).toBeNull();
    expect(plan.left).toBeNull();
  });
});
