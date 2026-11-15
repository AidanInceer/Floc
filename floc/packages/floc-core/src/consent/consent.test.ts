import { describe, expect, it } from "vitest";

import { CONSENT_CATEGORIES, CONSENT_MAX_AGE_SECONDS, FULL_CONSENT, NO_CONSENT, encodeConsent, readConsent } from "./consent";

describe("a consent choice", () => {
  it("reads back what was chosen", () => {
    const choice = { functional: true, analytics: false };
    expect(readConsent(encodeConsent(choice, "2026-11-15"), "2026-11-16")).toEqual(choice);
    expect(readConsent(encodeConsent(FULL_CONSENT, "2026-11-15"), "2026-11-15")).toEqual(FULL_CONSENT);
    expect(readConsent(encodeConsent(NO_CONSENT, "2026-11-15"), "2027-03-01")).toEqual(NO_CONSENT);
  });

  it("asks when nothing is stored or the value is not ours", () => {
    expect(readConsent(undefined, "2026-11-15")).toBeNull();
    expect(readConsent("", "2026-11-15")).toBeNull();
    expect(readConsent("yes", "2026-11-15")).toBeNull();
    expect(readConsent("1.f1.a1.2026-11-15; path=/", "2026-11-15")).toBeNull();
  });

  it("asks again after a year", () => {
    const stored = encodeConsent(FULL_CONSENT, "2026-11-15");
    expect(readConsent(stored, "2027-11-14")).toEqual(FULL_CONSENT);
    expect(readConsent(stored, "2027-11-15")).toBeNull();
  });

  it("asks when the choice is dated in the future", () => {
    expect(readConsent(encodeConsent(FULL_CONSENT, "2030-01-01"), "2026-11-15")).toBeNull();
  });

  it("never keeps its cookie longer than twelve months", () => {
    expect(CONSENT_MAX_AGE_SECONDS).toBeLessThanOrEqual(366 * 24 * 60 * 60);
  });

  it("has three categories and no advertising", () => {
    expect(CONSENT_CATEGORIES.map((c) => c.key)).toEqual(["necessary", "functional", "analytics"]);
  });
});
