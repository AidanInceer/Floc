import { describe, expect, it } from "vitest";

import { PILE_AT, PRO_FEATURES, PRO_STAGES, PRO_TABS, closeAt, landAt, tabsOpen } from "./pro-tour";

describe("the Pro tour", () => {
  it("walks the trip from deciding to home again", () => {
    expect(PRO_STAGES.map((s) => s.name)).toEqual(["Deciding", "Booking", "Away", "Home again"]);
  });

  it("shows every feature once across the trip", () => {
    const shown = PRO_STAGES.flatMap((s) => s.keys);
    expect(shown.length).toBe(new Set(shown).size);
    expect([...shown].sort()).toEqual(Object.keys(PRO_FEATURES).sort());
  });

  it("leaves the travel agent to its own band", () => {
    expect(Object.keys(PRO_FEATURES)).not.toContain("agent");
  });

  it("opens one planning tab per feature, in trip order", () => {
    expect(PRO_TABS).toEqual(PRO_STAGES.flatMap((s) => s.keys));
  });
});

describe("closing the tabs", () => {
  it("closes them one after another, left to right", () => {
    const times = PRO_TABS.map((_, i) => closeAt(i));
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(new Set(times).size).toBe(times.length);
  });

  it("shows the job done only after its tab has left the strip", () => {
    PRO_TABS.forEach((_, i) => expect(landAt(i)).toBeGreaterThan(closeAt(i)));
  });

  it("piles the closed tabs once the last job is done", () => {
    expect(PILE_AT).toBeGreaterThan(landAt(PRO_TABS.length - 1));
  });

  it("counts the Floc tab and every tab still open", () => {
    expect(tabsOpen(0)).toBe(PRO_TABS.length + 1);
    expect(tabsOpen(PRO_TABS.length)).toBe(1);
  });
});
