import { describe, expect, it } from "vitest";

import { previewNight, rangeMark, tapNight, weekRuns } from "./stay-calendar";

describe("tapNight", () => {
  it("starts a new range on the first tap and waits for the last night", () => {
    expect(tapNight({ start: "2026-12-18", end: "2026-12-20", picking: false }, "2026-12-22"))
      .toEqual({ start: "2026-12-22", end: "2026-12-22", picking: true });
  });

  it("sets the last night on the second tap", () => {
    expect(tapNight({ start: "2026-12-22", end: "2026-12-22", picking: true }, "2026-12-24"))
      .toEqual({ start: "2026-12-22", end: "2026-12-24", picking: false });
  });

  it("takes an earlier second tap as the first night", () => {
    expect(tapNight({ start: "2026-12-22", end: "2026-12-22", picking: true }, "2026-12-19"))
      .toEqual({ start: "2026-12-19", end: "2026-12-22", picking: false });
  });
});

describe("previewNight", () => {
  const pick = { start: "2026-12-21", end: "2026-12-23" };
  const was = { start: "2026-12-18", end: "2026-12-21", placeName: "Lisbon" };

  it("shows the new place on the picked nights", () => {
    expect(previewNight("2026-12-22", "Lagos", pick, was, "Sintra")).toBe("Sintra");
  });

  it("shows the picked nights as not set while the place has no name", () => {
    expect(previewNight("2026-12-22", "Lagos", pick, was, "  ")).toBeNull();
  });

  it("gives back the stay's old nights outside the pick", () => {
    expect(previewNight("2026-12-19", "Lisbon", pick, was, "Sintra")).toBeNull();
  });

  it("keeps every other night as it is", () => {
    expect(previewNight("2026-12-24", "Lagos", pick, was, "Sintra")).toBe("Lagos");
    expect(previewNight("2026-12-19", null, pick, { ...was, placeName: null }, "Sintra")).toBeNull();
  });
});

describe("rangeMark", () => {
  const pick = { start: "2026-12-16", end: "2026-12-22" };

  it("marks nothing outside the range", () => {
    expect(rangeMark("2026-12-15", pick)).toBeNull();
  });

  it("rounds the range at its ends and at each week's edge", () => {
    expect(rangeMark("2026-12-16", pick)).toEqual({ first: true, last: false });
    expect(rangeMark("2026-12-20", pick)).toEqual({ first: false, last: true });
    expect(rangeMark("2026-12-21", pick)).toEqual({ first: true, last: false });
    expect(rangeMark("2026-12-22", pick)).toEqual({ first: false, last: true });
    expect(rangeMark("2026-12-18", pick)).toEqual({ first: false, last: false });
  });
});

describe("weekRuns", () => {
  const week = [null, "2026-12-01", "2026-12-02", "2026-12-03", "2026-12-04", "2026-12-05", "2026-12-06"];
  const places: Record<string, string | null> = {
    "2026-12-02": "Lisbon", "2026-12-03": "Lisbon", "2026-12-04": "Lagos", "2026-12-05": null,
  };
  const placeOf = (d: string) => (d in places ? places[d] : undefined);

  it("joins the nights of one place into one bar and leaves gaps outside the trip", () => {
    expect(weekRuns(week, placeOf, () => false)).toEqual([
      { span: 2 },
      { span: 2, place: "Lisbon", on: false },
      { span: 1, place: "Lagos", on: false },
      { span: 1, place: null, on: false },
      { span: 1 },
    ]);
  });

  it("splits a bar where the picked range starts or ends", () => {
    expect(weekRuns(week, placeOf, (d) => d === "2026-12-03").slice(1, 3)).toEqual([
      { span: 1, place: "Lisbon", on: false },
      { span: 1, place: "Lisbon", on: true },
    ]);
  });
});
