import { describe, expect, it } from "vitest";

import { TRIP_COLORS } from "../trip/trip-color";
import { lightTokens } from "./tokens";
import { pastelOf } from "./pastels";

describe("the stored pastel words", () => {
  it("each paint with a real token", () => {
    for (const word of TRIP_COLORS) {
      expect(lightTokens[pastelOf(word)]).toMatch(/^#/);
      expect(lightTokens[`${pastelOf(word)}-ink`]).toMatch(/^#/);
    }
  });
});
