import { describe, expect, it } from "vitest";

import {
  addDays,
  dateRange,
  formatDateRange,
  hasEnded,
  nightsBetween,
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
