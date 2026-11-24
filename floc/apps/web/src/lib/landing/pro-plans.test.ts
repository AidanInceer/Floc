import { describe, expect, it } from "vitest";

import { proPlans } from "./pro-plans";

const MONTH = { interval: "monthly" as const, amountMinor: 399, currency: "GBP" as const };
const QUARTER = { interval: "quarterly" as const, amountMinor: 899, currency: "GBP" as const };
const YEAR = { interval: "yearly" as const, amountMinor: 2999, currency: "GBP" as const };

describe("proPlans", () => {
  it("lists the month, 3 months and the year, whatever order Stripe answers in", () => {
    const { plans } = proPlans([YEAR, QUARTER, MONTH]);
    expect(plans.map((p) => p.label)).toEqual(["Month", "3 months", "Year"]);
  });

  it("says each price with its period", () => {
    const { plans } = proPlans([MONTH, QUARTER, YEAR]);
    expect(plans.map((p) => [p.price, p.per])).toEqual([
      ["£3.99", "a month"],
      ["£8.99", "every 3 months"],
      ["£29.99", "a year"],
    ]);
  });

  it("works out the year's saving exactly against twelve months", () => {
    const year = proPlans([MONTH, YEAR]).plans.find((p) => p.interval === "yearly");
    expect(year?.saving).toBe("£17.89");
    expect(year?.savingOn).toBe("on the year");
  });

  it("works out the 3-month saving exactly against three months (#523)", () => {
    const quarter = proPlans([MONTH, QUARTER]).plans.find((p) => p.interval === "quarterly");
    expect(quarter?.saving).toBe("£2.98");
    expect(quarter?.savingOn).toBe("on 3 months");
  });

  it("marks only the year best value and opens on it when it saves the most (#523)", () => {
    const { plans, initial } = proPlans([MONTH, QUARTER, YEAR]);
    expect(plans.filter((p) => p.best).map((p) => p.interval)).toEqual(["yearly"]);
    expect(initial).toBe("yearly");
  });

  it("marks 3 months best value when no year is on sale", () => {
    const { plans, initial } = proPlans([MONTH, QUARTER]);
    expect(plans.filter((p) => p.best).map((p) => p.interval)).toEqual(["quarterly"]);
    expect(initial).toBe("quarterly");
  });

  it("claims no saving and no best value when the year costs as much as twelve months", () => {
    const { plans, initial } = proPlans([MONTH, { ...YEAR, amountMinor: 4788 }]);
    expect(plans.every((p) => p.saving === null && !p.best)).toBe(true);
    expect(initial).toBe("monthly");
  });

  it("claims no saving across two currencies", () => {
    const { plans } = proPlans([MONTH, { ...YEAR, currency: "EUR" }]);
    expect(plans.every((p) => p.saving === null)).toBe(true);
  });

  it("sells the one period Stripe has", () => {
    const { plans, initial } = proPlans([YEAR]);
    expect(plans).toHaveLength(1);
    expect(plans[0]?.saving).toBeNull();
    expect(initial).toBe("yearly");
  });

  it("has nothing to pick when no price can be read", () => {
    expect(proPlans([])).toEqual({ plans: [], initial: null });
  });
});
