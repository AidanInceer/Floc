import { describe, expect, it } from "vitest";

import { formatDate } from "./dates";
import { compactRange, spanLabel, forecastTab, groupTab, tripTab, yourDaysTab } from "./dates-tabs";

describe("yourDaysTab", () => {
  it("asks for days when you have none", () => {
    expect(yourDaysTab([], 0)).toEqual({ value: "Not yet", short: "Not yet", note: "Mark the days you can do", open: true });
  });

  it("does not ask again when you answered that you can do no day", () => {
    expect(yourDaysTab([], 0, true)).toEqual({ value: "No days", short: "No days", note: "You said you can do none", open: false });
  });

  it("gives the count and the span of your days", () => {
    expect(yourDaysTab(["2027-09-01", "2027-08-28", "2027-09-12"], 0)).toMatchObject({
      value: "3 days",
      note: spanLabel("2027-08-28", "2027-09-12"),
      open: false,
    });
  });

  it("says when changes are not saved", () => {
    expect(yourDaysTab(["2027-09-01"], 2)).toMatchObject({ value: "1 day", note: "2 changes not saved", open: true });
  });
});

describe("groupTab", () => {
  const person = (id: string, name: string, answered: boolean) => ({ id, name, answered });

  it("names who the group is waiting on", () => {
    const people = [person("a", "Ana", true), person("b", "Ben", true), person("c", "Cal", true), person("s", "Sofia", false)];
    expect(groupTab(people)).toEqual({ value: "3 of 4 answered", short: "3 of 4", note: "Waiting on Sofia", open: true });
  });

  it("says when everyone has answered", () => {
    expect(groupTab([person("a", "Ana", true), person("b", "Ben", true)])).toMatchObject({ note: "Everyone has answered", open: false });
  });

  it("waits on a guest who has not answered, and never counts them as answered", () => {
    const people = [person("a", "Ana", true), person("b", "Ben", true), person("g", "Sam", false)];
    expect(groupTab(people)).toMatchObject({ value: "2 of 3 answered", note: "Waiting on Sam", open: true });
  });

  it("calls the viewer you", () => {
    expect(groupTab([person("a", "Ana", false), person("b", "Ben", true)], "a")).toMatchObject({ note: "Waiting on you" });
  });
});

describe("tripTab", () => {
  it("reads the set dates and the nights", () => {
    expect(tripTab("2027-09-04", "2027-09-11", null)).toEqual({
      value: spanLabel("2027-09-04", "2027-09-11"),
      short: compactRange("2027-09-04", "2027-09-11"),
      note: "7 nights",
      open: false,
    });
  });

  it("points at the best fit when undated", () => {
    expect(tripTab(null, null, { start: "2027-09-06", end: "2027-09-12" })).toMatchObject({
      value: "No dates yet",
      note: `Best fit ${spanLabel("2027-09-06", "2027-09-12")}`,
      open: true,
    });
    expect(tripTab(null, null, null).note).toBe("Pick the days");
  });
});

describe("forecastTab", () => {
  it("counts the trip days the forecast reaches", () => {
    expect(forecastTab(8, 4, "2027-09-07")).toEqual({ value: "4 of 8 days", short: "4 of 8", note: `To ${formatDate("2027-09-07")}`, open: false });
  });

  it("follows the dates when there are none", () => {
    expect(forecastTab(0, 0, null)).toMatchObject({ value: "No dates yet", note: "Follows the trip's dates" });
  });
});

describe("compactRange", () => {
  it("drops the repeated month", () => {
    expect(compactRange("2027-10-04", "2027-10-11")).toBe("4–11 Oct");
    expect(compactRange("2027-10-28", "2027-11-02")).toBe("28 Oct – 2 Nov");
  });
});

describe("spanLabel", () => {
  it("names the month once when the span sits in one", () => {
    expect(spanLabel("2027-10-23", "2027-10-30")).toBe("Sat 23 – Sat 30 Oct");
  });

  it("names both months across a month end", () => {
    expect(spanLabel("2027-10-29", "2027-11-02")).toBe("Fri 29 Oct – Tue 2 Nov");
  });
});
