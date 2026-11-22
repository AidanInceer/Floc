import { describe, expect, it } from "vitest";

import { daysLabel } from "./words";

describe("daysLabel", () => {
  it("says no days for none", () => {
    expect(daysLabel(0)).toBe("No days");
  });

  it("counts days, one or many", () => {
    expect(daysLabel(1)).toBe("1 day");
    expect(daysLabel(5)).toBe("5 days");
  });
});
