import { describe, expect, it } from "vitest";

import { shortPlace } from "./place-name";

describe("shortPlace", () => {
  it("keeps the part before the first comma", () => {
    expect(shortPlace("Kyoto, Kyoto Prefecture, Japan")).toBe("Kyoto");
  });

  it("trims the space around it", () => {
    expect(shortPlace("  Porto , Portugal")).toBe("Porto");
  });

  it("returns a name with no comma whole", () => {
    expect(shortPlace("Lisbon")).toBe("Lisbon");
  });
});
