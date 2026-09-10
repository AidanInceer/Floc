import { describe, expect, it } from "vitest";

import {
  addDays,
  dateRange,
  countdownLabel,
  daysUntil,
  formatDate,
  formatDateRange,
  hasEnded,
  isIsoDate,
  splitEnded,
  nightsBetween,
  readIsoDate,
  readOptionalIsoDate,
  today,
  toIsoDate,
} from "./dates";

describe("date-only arithmetic", () => {
  it("adds days without drifting across a DST boundary", () => {
    // 2025-03-30 is the UK DST switch; UTC-midnight parsing must ignore it.
    expect(addDays("2025-03-29", 1)).toBe("2025-03-30");
    expect(addDays("2025-03-30", 1)).toBe("2025-03-31");
    expect(addDays("2025-10-25", 1)).toBe("2025-10-26");
  });

  it("crosses month and year ends", () => {
    expect(addDays("2025-01-31", 1)).toBe("2025-02-01");
    expect(addDays("2025-12-31", 1)).toBe("2026-01-01");
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
  });

  it("builds an inclusive range, and nothing from a bad one", () => {
    expect(dateRange("2025-08-01", "2025-08-04")).toEqual([
      "2025-08-01",
      "2025-08-02",
      "2025-08-03",
      "2025-08-04",
    ]);
    expect(dateRange("2025-08-04", "2025-08-01")).toEqual([]);
    expect(dateRange(null, "2025-08-01")).toEqual([]);
  });

  it("counts nights, not days", () => {
    expect(nightsBetween("2025-08-01", "2025-08-04")).toBe(3);
    expect(nightsBetween("2025-08-01", "2025-08-01")).toBe(0);
  });

  it("round-trips through toIsoDate", () => {
    expect(toIsoDate(new Date("2025-08-04T23:30:00Z"))).toBe("2025-08-04");
  });
});

describe("labels", () => {
  it("describes a partial date range rather than pretending it is set", () => {
    expect(formatDateRange(null, null)).toBe("Dates not set");
    expect(formatDateRange("2025-08-01", null)).toMatch(/^From /);
    expect(formatDateRange(null, "2025-08-01")).toMatch(/^Until /);
  });

  it("treats a past end date as ended — a label, not a lock", () => {
    expect(hasEnded("2020-01-01")).toBe(true);
    expect(hasEnded("2999-01-01")).toBe(false);
    expect(hasEnded(null)).toBe(false);
  });
});

/**
 * Ticket 113. Until these existed nothing checked a date at the door, so
 * `setTripDates` would happily store "soon" and every derivation downstream
 * quietly produced nonsense a long way from the typo.
 */
describe("isIsoDate", () => {
  it("accepts a real date-only string", () => {
    expect(isIsoDate("2026-09-01")).toBe(true);
    expect(isIsoDate("2024-02-29")).toBe(true); // a genuine leap day
  });

  it("rejects a well-shaped day that does not exist", () => {
    // JavaScript rolls an impossible date forward, which the round trip catches.
    expect(isIsoDate("2026-02-29")).toBe(false);
    expect(isIsoDate("2026-02-31")).toBe(false);
    expect(isIsoDate("2026-13-01")).toBe(false);
    expect(isIsoDate("2026-00-10")).toBe(false);
  });

  it("rejects anything that is not the shape at all", () => {
    for (const bad of ["soon", "", "2026-9-1", "01/09/2026", "2026-09-01T12:00:00Z"]) {
      expect(isIsoDate(bad), bad).toBe(false);
    }
  });

  it("rejects non-strings without throwing", () => {
    expect(isIsoDate(null)).toBe(false);
    expect(isIsoDate(undefined)).toBe(false);
    expect(isIsoDate(20260901)).toBe(false);
    expect(isIsoDate(new Date())).toBe(false);
  });
});

describe("readIsoDate", () => {
  it("hands back the date or null", () => {
    expect(readIsoDate("2026-09-01")).toBe("2026-09-01");
    expect(readIsoDate("soon")).toBeNull();
  });
});

describe("readOptionalIsoDate", () => {
  it("treats an empty box as undated, not as an error (rule 9)", () => {
    expect(readOptionalIsoDate("")).toBeNull();
    expect(readOptionalIsoDate("   ")).toBeNull();
    expect(readOptionalIsoDate(null)).toBeNull();
  });

  it("distinguishes 'nothing typed' from 'that is not a day'", () => {
    expect(readOptionalIsoDate("2026-09-01")).toBe("2026-09-01");
    expect(readOptionalIsoDate("soon")).toBeUndefined();
  });
});

describe("the awkward halves of the date helpers", () => {
  it("shows an em dash for no date, and drops the weekday on request", () => {
    // Month abbreviations come from ICU, which spells September "Sep" or
    // "Sept" depending on the runtime — match the shape, not the spelling.
    expect(formatDate(null)).toBe("—");
    expect(formatDate("2026-09-01")).toMatch(/^Tue 1 Sept?$/);
    expect(formatDate("2026-09-01", { weekday: false })).toMatch(/^1 Sept?$/);
    expect(formatDate("2026-09-01", { year: true })).toMatch(/^Tue,? 1 Sept? 2026$/);
  });

  it("writes a full range with the year on the far end only", () => {
    expect(formatDateRange("2026-09-01", "2026-09-05")).toMatch(
      /^Tue 1 Sept? – 5 Sept? 2026$/,
    );
  });

  it("counts the days to a date, and nothing to no date", () => {
    expect(daysUntil(null)).toBeNull();
    expect(daysUntil(today())).toBe(0);
    expect(daysUntil(addDays(today(), 3))).toBe(3);
  });

  it("names the countdown only while it is still ahead", () => {
    expect(countdownLabel(null)).toBeNull();
    expect(countdownLabel(addDays(today(), 4))).toBe("in 4 days");
    expect(countdownLabel(addDays(today(), 1))).toBe("tomorrow");
    expect(countdownLabel(today())).toBe("today");
    expect(countdownLabel(addDays(today(), -1))).toBeNull();
  });

  it("splits ended trips off the live ones, keeping their order", () => {
    const past = { endDate: addDays(today(), -1) };
    const soon = { endDate: addDays(today(), 1) };
    const older = { endDate: addDays(today(), -9) };
    const undated = { endDate: null };
    expect(splitEnded([past, soon, older, undated])).toEqual({
      live: [soon, undated],
      ended: [past, older],
    });
  });

  it("counts a trip ending today as still live", () => {
    expect(splitEnded([{ endDate: today() }]).ended).toEqual([]);
  });
});
