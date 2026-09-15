import { describe, expect, it } from "vitest";

import { dayHref } from "./trip-links";

describe("trip day links", () => {
  it("preserves selected date in the Days route", () => {
    expect(dayHref(42, "2026-09-09")).toBe("/trip/42/days?date=2026-09-09");
  });
});
