import { describe, expect, it } from "vitest";

import { bestWindows } from "./best-windows";

const day = (userId: string, date: string, preferred = false) => ({ userId, date, available: true, preferred });

const rows = ["2026-12-10", "2026-12-11", "2026-12-12"].flatMap((date) => [day("me", date), day("ana", date)]);

describe("bestWindows", () => {
  it("returns an empty list when nobody has marked a day", () => {
    expect(bestWindows([], [], "2026-12-01", () => undefined, "me")).toEqual([]);
  });

  it("gives each window its span, headline and reasons", () => {
    const [first] = bestWindows(rows, [], "2026-12-01", () => undefined, "me");
    expect(first.start).toBe("2026-12-10");
    expect(first.end).toBe("2026-12-12");
    expect(first.headline).toContain("All 2 can make it");
  });

  it("names the viewer You and falls back to A guest", () => {
    const days = Array.from({ length: 10 }, (_, i) => `2026-12-${String(10 + i).padStart(2, "0")}`);
    const wide = [...days.map((d) => day("ana", d)), ...days.slice(0, 3).map((d) => day("me", d))];
    const lengths = [
      { userId: "ana", length: "week" as const },
      { userId: "me", length: "long_weekend" as const },
    ];
    const reasons = bestWindows(wide, lengths, "2026-12-01", () => undefined, "me").flatMap((w) => w.reasons);
    expect(reasons).toContain("A guest wants at least 6 nights");
  });
});
