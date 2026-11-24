import { describe, expect, it } from "vitest";

import { phoneRoute } from "./notification-href";
import { notificationText } from "./notification-text";
import {
  mergeMove,
  orderPlanChanges,
  planChangeHref,
  readPlanChange,
  spotWords,
  writePlanChange,
  type PlanChange,
} from "./plan-change";
import { recipientsFor } from "./rules";

const dinner: PlanChange = {
  eventId: 7,
  title: "New Year's dinner",
  date: "2026-12-31",
  time: "20:30",
  before: { date: "2026-12-31", time: "20:00" },
};

describe("a plan change", () => {
  it("reads back what was written", () => {
    expect(readPlanChange(writePlanChange(dinner))).toEqual(dinner);
  });

  it("reads a damaged detail as nothing", () => {
    expect(readPlanChange("not json")).toBeNull();
    expect(readPlanChange('{"title":"No event"}')).toBeNull();
    expect(readPlanChange(null)).toBeNull();
  });

  it("names the event, the person and the trip", () => {
    const detail = writePlanChange(dinner);
    expect(notificationText("event_moved", { actor: "Priya", trip: "Portugal", detail })).toBe("Priya moved New Year's dinner on Portugal");
    expect(notificationText("event_added", { actor: "Sam", trip: "Portugal", detail })).toBe("Sam added New Year's dinner to Portugal");
    expect(notificationText("event_removed", { actor: "Maya", trip: "Portugal", detail })).toBe("Maya removed New Year's dinner from Portugal");
  });

  it("names a shared file", () => {
    expect(notificationText("file_added", { actor: "Sam", trip: "Portugal", detail: "Hotel booking.pdf" })).toBe("Sam added Hotel booking.pdf to Portugal");
  });

  it("still reads when its detail is lost", () => {
    expect(notificationText("event_moved", { actor: "Priya", trip: "Portugal", detail: null })).toBe("Priya moved an event on Portugal");
  });

  it.each(["event_added", "event_moved", "event_removed", "file_added"] as const)("%s reaches the other members and alerts nobody", (kind) => {
    expect(recipientsFor({ kind, actorId: "a", affected: [], members: ["a", "b", "c"] })).toEqual([
      { userId: "b", loud: false },
      { userId: "c", loud: false },
    ]);
  });

  it("keeps the first old value across quick moves", () => {
    const again: PlanChange = { ...dinner, time: "21:00", before: { date: "2026-12-31", time: "20:30" } };
    expect(mergeMove(writePlanChange(dinner), again)).toEqual({ ...again, before: { date: "2026-12-31", time: "20:00" } });
  });

  it("says only the time when a move stays on one day", () => {
    expect(spotWords("event_moved", dinner)).toEqual({ was: "20:00", now: "20:30" });
  });

  it("says the day when a move crosses days", () => {
    const next = { ...dinner, date: "2027-01-01" };
    expect(spotWords("event_moved", next)).toEqual({ was: "Thu 31 Dec 20:00", now: "Fri 1 Jan 20:30" });
  });

  it("says when an added event is, and when a removed one was", () => {
    const fresh = { ...dinner, before: null };
    expect(spotWords("event_added", fresh)).toEqual({ was: null, now: "Thu 31 Dec 20:30" });
    expect(spotWords("event_removed", fresh)).toEqual({ was: "Thu 31 Dec 20:30", now: null });
  });

  it("calls an event with no time all day", () => {
    expect(spotWords("event_added", { ...dinner, time: null, before: null }).now).toBe("Thu 31 Dec All day");
  });

  it("orders changes by where they sit in the trip", () => {
    const at = (id: number, date: string, time: string | null) => ({ id, change: { ...dinner, date, time } });
    expect(orderPlanChanges([at(1, "2027-01-05", "10:30"), at(2, "2026-12-31", "20:30"), at(3, "2026-12-31", null)]).map((r) => r.id)).toEqual([3, 2, 1]);
  });

  it("opens on the Overview with its own row, on web and phone", () => {
    const href = planChangeHref("/trip/4/overview", 12);
    expect(href).toBe("/trip/4/overview?change=12");
    expect(phoneRoute(href)).toBe("/trip/4?change=12");
    expect(phoneRoute("/trip/4/overview")).toBe("/trip/4");
  });
});
