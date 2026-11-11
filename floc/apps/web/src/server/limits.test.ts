/**
 * The ceilings (ticket 108). Small, but the behaviour at a limit is a decision
 * — truncate and say so on the server, never throw — and a decision with no
 * test is a comment.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { isRefusal } from "@floc/core/errors/refusal";

import { assertRoom, bounded, LIMITS, reportCeiling } from "@/server/limits";
import { capturedLog } from "@/test/captured-log";

afterEach(() => vi.restoreAllMocks());

describe("bounded", () => {
  it("passes the rows through untouched", () => {
    const rows = [1, 2, 3];
    expect(bounded(rows, "days", "trip 1")).toBe(rows);
  });

  it("stays quiet below the ceiling", () => {
    expect(capturedLog(() => bounded(new Array(LIMITS.days - 1).fill(0), "days", "trip 1"))).toEqual([]);
  });

  it("reports once the read comes back at the ceiling", () => {
    const rows = new Array(LIMITS.days).fill(0);
    let kept: number[] = [];
    // Truncated, not thrown — rule 11 is degrade, don't crash.
    const lines = capturedLog(() => (kept = bounded(rows, "days", "trip 1")));
    expect(kept).toHaveLength(LIMITS.days);
    expect(lines).toEqual([expect.objectContaining({ level: "warn", limit: "days" })]);
  });
});

describe("reportCeiling", () => {
  it("names the limit and the scope, and nothing else", () => {
    const [line] = capturedLog(() => reportCeiling("members", "trip 42"));
    expect(line).toMatchObject({ message: "limit.ceiling", limit: "members", max: LIMITS.members, scope: "trip 42" });
  });
});

describe("assertRoom", () => {
  const refusalOf = (fn: () => void) => {
    try {
      fn();
    } catch (error) {
      return error;
    }
    return null;
  };

  it("lets a write in up to the ceiling", () => {
    expect(refusalOf(() => assertRoom("ideas", LIMITS.ideas - 1))).toBeNull();
    expect(refusalOf(() => assertRoom("days", LIMITS.days - 3, 3))).toBeNull();
  });

  it("refuses, with a sentence for the person, the write that would pass it", () => {
    const refusal = refusalOf(() => assertRoom("eventsPerDay", LIMITS.eventsPerDay));
    expect(isRefusal(refusal)).toBe(true);
    expect((refusal as Error).message).toMatch(/day/);
    expect(isRefusal(refusalOf(() => assertRoom("days", LIMITS.days - 2, 3)))).toBe(true);
  });
});
