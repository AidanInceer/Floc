import { describe, expect, it } from "vitest";

import { EVENT_CATEGORIES } from "../event-categories";
import { eventName } from "./event-name";

describe("eventName", () => {
  it("uses the title when there is one", () => {
    expect(eventName({ title: "Tea ceremony", placeName: "Gion", type: "activity" })).toBe("Tea ceremony");
  });

  it("falls back to the place when the title is missing", () => {
    expect(eventName({ title: null, placeName: "Fushimi Inari", type: "activity" })).toBe("Fushimi Inari");
  });

  it("falls back to the category's word, so a block is never blank", () => {
    expect(eventName({ title: null, placeName: null, type: "food" })).toBe(EVENT_CATEGORIES.food.label);
  });
});
