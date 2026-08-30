/**
 * The ceilings (ticket 108). Small, but the behaviour at a limit is a decision
 * — truncate and say so on the server, never throw — and a decision with no
 * test is a comment.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { bounded, LIMITS, reportCeiling } from "@/server/limits";

afterEach(() => vi.restoreAllMocks());

describe("bounded", () => {
  it("passes the rows through untouched", () => {
    const rows = [1, 2, 3];
    expect(bounded(rows, "days", "trip 1")).toBe(rows);
  });

  it("says nothing below the ceiling", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    bounded(new Array(LIMITS.days - 1).fill(0), "days", "trip 1");
    expect(warn).not.toHaveBeenCalled();
  });

  it("reports once the read comes back at the ceiling", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const rows = new Array(LIMITS.days).fill(0);
    // Truncated, not thrown — rule 11 is degrade, don't crash.
    expect(bounded(rows, "days", "trip 1")).toHaveLength(LIMITS.days);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain("days");
  });
});

describe("reportCeiling", () => {
  it("names the limit and the scope, and nothing else", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    reportCeiling("members", "trip 42");
    const message = String(warn.mock.calls[0][0]);
    expect(message).toContain("members");
    expect(message).toContain("trip 42");
    expect(message).toContain(String(LIMITS.members));
  });
});
