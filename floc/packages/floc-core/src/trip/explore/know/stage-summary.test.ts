import { describe, expect, it } from "vitest";

import type { KnowStage } from "./know-types";
import { stageMeta, stageSummary } from "./stage-summary";

const money: KnowStage = {
  stage: "Money",
  tips: [
    { icon: "money", title: "Carry cash", text: "x" },
    { icon: "money", title: "Tip drivers", text: "x", temporary: "Until June" },
  ],
};
const stops: KnowStage = {
  stage: "At the stops",
  stops: [
    { place: "Kandy", tips: [{ title: "a", text: "x" }, { title: "b", text: "x" }] },
    { place: "Ella", tips: [{ title: "c", text: "x", temporary: "Until the line reopens" }] },
  ],
};

describe("stageSummary", () => {
  it("counts tips and temporary tips, and peeks at the tip titles", () => {
    expect(stageSummary(money)).toEqual({ tips: 2, temporary: 1, peek: "Carry cash · Tip drivers" });
  });

  it("strips ** marks from the peek", () => {
    const marked: KnowStage = { stage: "Money", tips: [{ icon: "money", title: "Carry **N$500**", text: "x" }] };
    expect(stageSummary(marked).peek).toBe("Carry N$500");
  });

  it("counts a stop stage's tips across stops and peeks at the places", () => {
    expect(stageSummary(stops)).toEqual({ tips: 3, temporary: 1, peek: "Kandy · Ella" });
  });
});

describe("stageMeta", () => {
  it("says tips and temporary", () => {
    expect(stageMeta({ tips: 3, temporary: 1, peek: "" })).toBe("3 tips · 1 temporary");
  });

  it("says 1 tip, singular, and omits temporary when none", () => {
    expect(stageMeta({ tips: 1, temporary: 0, peek: "" })).toBe("1 tip");
  });
});
