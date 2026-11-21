import { describe, expect, it } from "vitest";

import { dayRemovalMessage, planDayRemoval } from "./day-removal";

const week = [
  { id: 1, date: "2026-11-01" },
  { id: 2, date: "2026-11-02" },
  { id: 3, date: "2026-11-03" },
  { id: 4, date: "2026-11-04" },
  { id: 5, date: "2026-11-05" },
  { id: 6, date: "2026-11-06" },
  { id: 7, date: "2026-11-07" },
];
const dated = { startDate: "2026-11-01", endDate: "2026-11-07" };

describe("planDayRemoval", () => {
  it("starts the trip a day later when the first day goes", () => {
    const plan = planDayRemoval(week, 1, dated, []);
    expect(plan).toMatchObject({ position: "first", movedDays: 0, start: "2026-11-02", end: "2026-11-07" });
  });

  it("ends the trip a day earlier when the last day goes", () => {
    const plan = planDayRemoval(week, 7, dated, []);
    expect(plan).toMatchObject({ position: "last", movedDays: 0, start: "2026-11-01", end: "2026-11-06" });
  });

  it("moves every later day a day earlier when a middle day goes (rule 3)", () => {
    const plan = planDayRemoval(week, 4, dated, []);
    expect(plan).toMatchObject({ position: "middle", movedDays: 3, start: "2026-11-01", end: "2026-11-06" });
  });

  it("leaves the trip with no dates when its only day goes (rule 9)", () => {
    const plan = planDayRemoval([week[0]], 1, { startDate: "2026-11-01", endDate: "2026-11-01" }, []);
    expect(plan).toMatchObject({ position: "only", start: null, end: null });
  });

  it("keeps an undated trip undated", () => {
    const plan = planDayRemoval(week, 4, { startDate: null, endDate: null }, []);
    expect(plan).toMatchObject({ start: null, end: null, movedDays: 3 });
  });

  it("names only the bookings on the days that move, with the date each lands on", () => {
    const plan = planDayRemoval(week, 4, dated, [
      { dayId: 2, label: "Train to Porto" },
      { dayId: 5, label: "Flight to Rome" },
      { dayId: 7, label: "Hotel Lume" },
    ]);
    expect(plan?.bookings).toEqual([
      { label: "Flight to Rome", movesTo: "2026-11-04" },
      { label: "Hotel Lume", movesTo: "2026-11-06" },
    ]);
  });

  it("returns null for a day that is not on the trip", () => {
    expect(planDayRemoval(week, 99, dated, [])).toBeNull();
  });
});

describe("dayRemovalMessage", () => {
  it("says where the trip now starts", () => {
    const plan = planDayRemoval(week, 1, dated, []);
    expect(dayRemovalMessage(plan!)).toBe("Sun 1 Nov and its events go. The trip now starts Mon 2 Nov.");
  });

  it("says where the trip now ends", () => {
    const plan = planDayRemoval(week, 7, dated, []);
    expect(dayRemovalMessage(plan!)).toBe("Sat 7 Nov and its events go. The trip now ends Fri 6 Nov.");
  });

  it("counts the days that move and names their bookings", () => {
    const plan = planDayRemoval(week, 4, dated, [
      { dayId: 5, label: "Flight to Rome" },
      { dayId: 7, label: "Hotel Lume" },
    ]);
    expect(dayRemovalMessage(plan!)).toBe(
      "Wed 4 Nov and its events go. 3 later days move a day earlier. Flight to Rome moves to Wed 4 Nov. Hotel Lume moves to Fri 6 Nov. The trip now ends Fri 6 Nov.",
    );
  });

  it("speaks of one later day in the singular", () => {
    const plan = planDayRemoval(week, 6, dated, []);
    expect(dayRemovalMessage(plan!)).toBe(
      "Fri 6 Nov and its events go. 1 later day moves a day earlier. The trip now ends Fri 6 Nov.",
    );
  });

  it("warns that the only day takes the dates with it", () => {
    const plan = planDayRemoval([week[0]], 1, { startDate: "2026-11-01", endDate: "2026-11-01" }, []);
    expect(dayRemovalMessage(plan!)).toBe("Sun 1 Nov and its events go. The trip will have no dates.");
  });

  it("says nothing about dates on an undated trip", () => {
    const plan = planDayRemoval(week, 7, { startDate: null, endDate: null }, []);
    expect(dayRemovalMessage(plan!)).toBe("Sat 7 Nov and its events go.");
  });
});
