import { describe, expect, it } from "vitest";

import { TERMS_VERSION } from "./terms";

describe("the version of the terms", () => {
  it("is the day the wording took effect", () => {
    expect(TERMS_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number.isNaN(Date.parse(TERMS_VERSION))).toBe(false);
  });
});
