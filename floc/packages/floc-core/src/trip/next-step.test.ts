import { describe, expect, it } from "vitest";

import { nextStepFor, type NextStepInput } from "./next-step";

const empty = (over: Partial<NextStepInput> = {}): NextStepInput => ({
  memberCount: 2,
  datesUnset: true,
  dayCount: 0,
  expenseCount: 0,
  viewerHasPacking: false,
  ...over,
});

const filled: NextStepInput = {
  memberCount: 2,
  datesUnset: false,
  dayCount: 3,
  expenseCount: 1,
  viewerHasPacking: true,
};

describe("the one next step", () => {
  it("asks a lone viewer on an undated trip to invite", () => {
    expect(nextStepFor(empty({ memberCount: 1 }))?.key).toBe("invite");
  });

  it("moves past invite for a solo trip once dates are set", () => {
    expect(nextStepFor(empty({ memberCount: 1, datesUnset: false }))?.key).toBe("days");
  });

  it("asks for dates once someone else is on the trip", () => {
    expect(nextStepFor(empty())?.key).toBe("dates");
  });

  it("asks for days once dates are set", () => {
    expect(nextStepFor(empty({ datesUnset: false }))?.key).toBe("days");
  });

  it("asks for money once days exist", () => {
    expect(nextStepFor({ ...filled, expenseCount: 0 })?.key).toBe("money");
  });

  it("asks for packing once money has something", () => {
    expect(nextStepFor({ ...filled, viewerHasPacking: false })?.key).toBe("packing");
  });

  it("points to the first empty step, not a later one", () => {
    expect(nextStepFor({ ...filled, dayCount: 0, viewerHasPacking: false })?.key).toBe("days");
  });

  it("says nothing when no step is empty", () => {
    expect(nextStepFor(filled)).toBeNull();
  });

  it("gives every step words and a place to go", () => {
    const inputs = [
      empty({ memberCount: 1 }),
      empty(),
      empty({ datesUnset: false }),
      { ...filled, expenseCount: 0 },
      { ...filled, viewerHasPacking: false },
    ];
    for (const input of inputs) {
      const step = nextStepFor(input);
      expect(step?.said.length).toBeGreaterThan(0);
      expect(step?.action.length).toBeGreaterThan(0);
    }
  });
});
