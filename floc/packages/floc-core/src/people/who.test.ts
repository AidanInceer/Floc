import { describe, expect, it } from "vitest";

import { whoTone } from "./who";

describe("whoTone", () => {
  it("gives each name the tone it has always had, long names included", () => {
    expect(["Ada", "Tom Whitfield", "Priya Raman", "Zoë", "a".repeat(80)].map(whoTone)).toEqual([
      "who-7",
      "who-1",
      "who-7",
      "who-7",
      "who-1",
    ]);
  });
});
