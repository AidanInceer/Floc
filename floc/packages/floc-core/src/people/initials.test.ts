import { describe, expect, it } from "vitest";

import { initials } from "./initials";

describe("initials", () => {
  it("takes the first letter of the first two words", () => {
    expect(initials("aidan inceer")).toBe("AI");
    expect(initials("Mary Jane Watson")).toBe("MJ");
  });

  it("takes the first two letters of a single name", () => {
    expect(initials("  aidan  ")).toBe("Ai");
    expect(initials("Jo")).toBe("Jo");
  });

  it("keeps a one-letter name as one letter", () => {
    expect(initials("x")).toBe("X");
    expect(initials("")).toBe("");
  });
});
