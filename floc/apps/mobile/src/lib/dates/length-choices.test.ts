import { describe, expect, it } from "vitest";

import { picksOf, withPicks } from "./length-choices";

const choices = [
  { userId: "ana", length: "week" as const },
  { userId: "me", length: "week" as const },
];

describe("picksOf", () => {
  it("reads whether you picked each length", () => {
    expect(picksOf(choices, "me")).toEqual({ long_weekend: false, short_break: false, week: true, longer: false });
  });
});

describe("withPicks", () => {
  it("swaps your choices for your picks and keeps everyone else's", () => {
    const next = withPicks(choices, "me", { long_weekend: true, short_break: false, week: false, longer: false });
    expect(next).toEqual([
      { userId: "ana", length: "week" },
      { userId: "me", length: "long_weekend" },
    ]);
  });
});
