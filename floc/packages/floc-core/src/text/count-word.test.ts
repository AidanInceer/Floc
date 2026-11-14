import { describe, expect, it } from "vitest";

import { countWord, nounFor } from "./count-word";

describe("countWord", () => {
  it("says one thing in the singular", () => {
    expect(countWord(1, "night")).toBe("1 night");
  });

  it("says none and many in the plural", () => {
    expect(countWord(0, "day")).toBe("0 days");
    expect(countWord(4, "night")).toBe("4 nights");
  });
});

describe("nounFor", () => {
  it("gives the word alone, by the same rule", () => {
    expect(nounFor(1, "trip")).toBe("trip");
    expect(nounFor(2, "trip")).toBe("trips");
  });
});
