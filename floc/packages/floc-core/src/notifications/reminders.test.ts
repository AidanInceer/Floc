import { describe, expect, it } from "vitest";

import { reminderDay, remindersDue } from "./reminders";
import { REMINDER_KINDS, isReminder } from "./rules";

describe("reminderDay", () => {
  it("is nothing before 08:00 UTC", () => {
    expect(reminderDay(new Date("2026-09-13T07:59:59Z"))).toBeNull();
  });

  it("is today's date from 08:00 UTC", () => {
    expect(reminderDay(new Date("2026-09-13T08:00:00Z"))).toBe("2026-09-13");
    expect(reminderDay(new Date("2026-09-13T23:10:00Z"))).toBe("2026-09-13");
  });
});

describe("remindersDue", () => {
  const today = "2026-09-13";

  it("says a trip starts in a week, 7 days before", () => {
    expect(remindersDue({ startDate: "2026-09-20", endDate: "2026-09-25" }, today)).toEqual(["trip_starts_week"]);
  });

  it("says a trip starts today, on the start date", () => {
    expect(remindersDue({ startDate: today, endDate: "2026-09-20" }, today)).toEqual(["trip_starts_today"]);
  });

  it("chases money 3 days after the end", () => {
    expect(remindersDue({ startDate: "2026-09-01", endDate: "2026-09-10" }, today)).toEqual(["still_owe"]);
  });

  it("remembers the trip one year after it started", () => {
    expect(remindersDue({ startDate: "2025-09-13", endDate: "2025-09-15" }, today)).toEqual(["year_ago"]);
  });

  it("gives an undated trip nothing", () => {
    expect(remindersDue({ startDate: null, endDate: null }, today)).toEqual([]);
  });

  it("gives an ordinary day nothing", () => {
    expect(remindersDue({ startDate: "2026-10-01", endDate: "2026-10-05" }, today)).toEqual([]);
  });
});

describe("reminder kinds", () => {
  it("are told apart from changes", () => {
    for (const kind of REMINDER_KINDS) expect(isReminder(kind)).toBe(true);
    expect(isReminder("nudge_sent")).toBe(false);
  });
});
