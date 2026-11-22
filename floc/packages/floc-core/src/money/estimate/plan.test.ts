import { describe, expect, it } from "vitest";

import { isFlying, planFor } from "./plan";

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

  it("leaves a line that is not needed out of the total, and its spending in Spent", () => {
    const plan = planFor({ guide, own: { flights: { figure: null, budget: null, notNeeded: true } }, spent, budget: 110000 });
    expect(plan.lines[0]).toMatchObject({ line: "flights", needed: false, plan: null, spent: 14200 });
    expect(plan.total).toEqual([31500 + 24000 + 12000, 49000 + 36000 + 24000]);
    expect(plan.spent).toBe(25500);
    expect(plan.left).toBe(110000 - 25500);
  });

  it("keeps a removed line's own figure for when it comes back", () => {
    const plan = planFor({ guide, own: { stay: { figure: 40000, budget: 45000, notNeeded: true } }, spent, budget: null });
    expect(plan.lines[1]).toMatchObject({ needed: false, plan: null, own: 40000, budget: 45000 });
  });

  it("waits for a figure before it fits a budget to a way with no guide", () => {
    const byTrain = [{ line: "flights" as const, range: null, missing: "travel" as const }, ...guide.slice(1)];
    const waiting = planFor({ guide: byTrain, own: {}, spent, budget: 200000, travel: "train" });
    expect(waiting.awaiting).toBe("train");
    expect(waiting.fit).toBeNull();
    const priced = planFor({ guide: byTrain, own: { flights: { figure: 8000, budget: null } }, spent, budget: 200000, travel: "train" });
    expect(priced.awaiting).toBeNull();
    expect(priced.fit).toEqual({ kind: "fits" });
  });

  it("counts as flying only with flights chosen and the line still in", () => {
    expect(isFlying(planFor({ guide, own: {}, spent, budget: null }))).toBe(true);
    expect(isFlying(planFor({ guide, own: {}, spent, budget: null, travel: "train" }))).toBe(false);
    expect(isFlying(planFor({ guide, own: { flights: { figure: null, budget: null, notNeeded: true } }, spent, budget: null }))).toBe(false);
  });

  it("does not wait on a way of travelling the member took out", () => {
    const byTrain = [{ line: "flights" as const, range: null, missing: "travel" as const }, ...guide.slice(1)];
    const plan = planFor({ guide: byTrain, own: { flights: { figure: null, budget: null, notNeeded: true } }, spent, budget: 200000, travel: "train" });
    expect(plan.awaiting).toBeNull();
    expect(plan.fit).toEqual({ kind: "fits" });
  });

  it("has no fit and nothing left without a budget", () => {
    const plan = planFor({ guide, own: {}, spent, budget: null });
    expect(plan.fit).toBeNull();
    expect(plan.left).toBeNull();
  });
});
