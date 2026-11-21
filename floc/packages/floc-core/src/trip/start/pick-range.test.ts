import { describe, expect, it } from "vitest";

import { pickRange } from "./pick-range";

describe("pickRange (rule 9: a trip may have no dates)", () => {
  it("starts a range on the first tap", () => {
    expect(pickRange({ start: null, end: null }, "2027-05-14")).toEqual({ start: "2027-05-14", end: null });
  });

  it("closes the range on a later day", () => {
    expect(pickRange({ start: "2027-05-14", end: null }, "2027-05-21")).toEqual({ start: "2027-05-14", end: "2027-05-21" });
  });

  it("starts again on an earlier day", () => {
    expect(pickRange({ start: "2027-05-14", end: null }, "2027-05-10")).toEqual({ start: "2027-05-10", end: null });
  });

  it("starts again once a range is complete", () => {
    expect(pickRange({ start: "2027-05-14", end: "2027-05-21" }, "2027-06-02")).toEqual({ start: "2027-06-02", end: null });
  });

  it("follows the listing's nights when they are fixed", () => {
    expect(pickRange({ start: null, end: null }, "2027-05-08", 12)).toEqual({ start: "2027-05-08", end: "2027-05-20" });
  });
});
