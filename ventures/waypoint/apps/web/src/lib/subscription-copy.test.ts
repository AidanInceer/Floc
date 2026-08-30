import { describe, expect, it } from "vitest";

import { isLive, renewalLabel } from "./subscription-copy";

const NOW = new Date("2026-03-01T00:00:00Z");
const LATER = new Date("2026-04-01T00:00:00Z");
const EARLIER = new Date("2026-02-01T00:00:00Z");

const facts = (over: Partial<Parameters<typeof isLive>[0]> = {}) => ({
  status: "active",
  cancelAtPeriodEnd: false,
  currentPeriodEnd: LATER,
  ...over,
});

describe("isLive", () => {
  it("counts an active subscription paid up to a future date", () => {
    expect(isLive(facts(), NOW)).toBe(true);
  });

  it("counts a comp, which has no end at all", () => {
    expect(isLive(facts({ currentPeriodEnd: null }), NOW)).toBe(true);
  });

  it("refuses a row whose period already ran out", () => {
    expect(isLive(facts({ currentPeriodEnd: EARLIER }), NOW)).toBe(false);
  });

  it("refuses a cancelled row", () => {
    expect(isLive(facts({ status: "canceled" }), NOW)).toBe(false);
  });
});

describe("renewalLabel", () => {
  it("says renews while the subscription is still rolling on", () => {
    expect(renewalLabel(facts(), NOW)).toBe("Renews 1 Apr 2026");
  });

  it("says ends once someone has cancelled, not renews", () => {
    expect(renewalLabel(facts({ cancelAtPeriodEnd: true }), NOW)).toBe(
      "Ends 1 Apr 2026",
    );
  });

  it("says a comp never expires", () => {
    expect(renewalLabel(facts({ currentPeriodEnd: null }), NOW)).toBe(
      "Never expires.",
    );
  });

  it("speaks in the past once the access is gone", () => {
    expect(renewalLabel(facts({ status: "canceled" }), NOW)).toBe(
      "Your Pro access has ended.",
    );
  });
});
