import { describe, expect, it } from "vitest";

import { SECTION_COLOURS } from "./section-colours";
import { resolveTokens } from "./tokens";

describe("trip section colours", () => {
  it("provides a wash and ink in both themes for every section", () => {
    for (const theme of ["light", "dark"] as const) {
      const tokens = resolveTokens(theme);
      for (const colour of Object.values(SECTION_COLOURS)) {
        expect(tokens[`pastel-${colour}`]).toMatch(/^#/);
        expect(tokens[`pastel-${colour}-ink`]).toMatch(/^#/);
      }
    }
  });
});
