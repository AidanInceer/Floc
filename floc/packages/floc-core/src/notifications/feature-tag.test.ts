import { describe, expect, it } from "vitest";

import { featureTag } from "./feature-tag";

describe("the feature a notice is about (ADR-034)", () => {
  it("names money changes Money, in the Money red", () => {
    expect(featureTag("expense_added")).toEqual({ word: "Money", colour: "red" });
    expect(featureTag("settlement_recorded")).toEqual({ word: "Money", colour: "red" });
  });

  it("names a date change Dates, in the When yellow, and a day change Days, in green", () => {
    expect(featureTag("trip_dates_changed")).toEqual({ word: "Dates", colour: "yellow" });
    expect(featureTag("days_added")).toEqual({ word: "Days", colour: "green" });
  });

  it("names a filed booking Files, in green", () => {
    expect(featureTag("booking_filed")).toEqual({ word: "Files", colour: "green" });
  });

  it("gives no tag where the notice is about no one feature", () => {
    expect(featureTag("member_joined")).toBeNull();
    expect(featureTag("comment_added")).toBeNull();
  });
});
