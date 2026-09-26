import { describe, expect, it } from "vitest";

import { initials } from "./initials";

describe("initials", () => {
  it("takes the first letter of the first two words", () => {
    expect(initials("aidan inceer")).toBe("AI");
    expect(initials("  Ada  ")).toBe("A");
    expect(initials("Mary Jane Watson")).toBe("MJ");
    expect(initials("")).toBe("");
  });
});
