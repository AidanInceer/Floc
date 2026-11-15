import { describe, expect, it } from "vitest";

import { ANALYTICS_EVENTS, ANALYTICS_KEEP_DAYS, ANALYTICS_SURFACES, isAnalyticsEvent } from "./events";

describe("what Floc counts", () => {
  it("knows its own event names and no others", () => {
    for (const name of ANALYTICS_EVENTS) expect(isAnalyticsEvent(name)).toBe(true);
    expect(isAnalyticsEvent("made.up")).toBe(false);
    expect(isAnalyticsEvent(undefined)).toBe(false);
    expect(isAnalyticsEvent(12)).toBe(false);
  });

  it("counts on the web and both phones, and keeps a row a year at most", () => {
    expect(ANALYTICS_SURFACES).toEqual(["web", "ios", "android"]);
    expect(ANALYTICS_KEEP_DAYS).toBeLessThanOrEqual(366);
  });
});
