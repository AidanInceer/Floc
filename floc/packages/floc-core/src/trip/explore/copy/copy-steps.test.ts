import { describe, expect, it } from "vitest";

import { copySteps, stepBack, stepOn } from "./copy-steps";

describe("copySteps", () => {
  it("asks, then when, then what else comes across, before anyone answers", () => {
    expect(copySteps(null)).toEqual(["ask", "when", "extras"]);
  });

  it("keeps all three steps for Yes", () => {
    expect(copySteps(true)).toEqual(["ask", "when", "extras"]);
  });

  it("goes straight to what comes across for Not yet", () => {
    expect(copySteps(false)).toEqual(["ask", "undated"]);
  });
});

describe("stepOn and stepBack", () => {
  it("moves through the Yes steps and stops at the last", () => {
    expect(stepOn("ask", true)).toBe("when");
    expect(stepOn("when", true)).toBe("extras");
    expect(stepOn("extras", true)).toBe("extras");
  });

  it("moves from the question to the undated step for Not yet", () => {
    expect(stepOn("ask", false)).toBe("undated");
  });

  it("steps back and stops at the question", () => {
    expect(stepBack("extras", true)).toBe("when");
    expect(stepBack("undated", false)).toBe("ask");
    expect(stepBack("ask", null)).toBe("ask");
  });
});
