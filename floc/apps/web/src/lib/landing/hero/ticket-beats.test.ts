import { describe, expect, it } from "vitest";

import { FLOWN, STAMPED, TICKET_BEATS, TICKET_FIELDS, TICKET_SORTED_MS, fieldFilled } from "./ticket-beats";

describe("phone hero ticket beats", () => {
  it("plays its beats in time order", () => {
    expect([...TICKET_BEATS]).toEqual([...TICKET_BEATS].sort((a, b) => a - b));
  });

  it("flies the plane before any field fills, and stamps only after the last one", () => {
    const fills = TICKET_FIELDS.map((_, i) => TICKET_BEATS.findIndex((_, step) => fieldFilled(step + 1, i)) + 1);
    expect(fills.every((step) => step > FLOWN)).toBe(true);
    expect(STAMPED).toBeGreaterThan(Math.max(...fills));
    expect(STAMPED).toBe(TICKET_BEATS.length);
  });

  it("fills each field in turn, one per beat", () => {
    expect(TICKET_FIELDS.map((_, i) => fieldFilled(FLOWN, i))).toEqual([false, false, false, false]);
    expect(TICKET_FIELDS.map((_, i) => fieldFilled(FLOWN + 2, i))).toEqual([true, true, false, false]);
    expect(TICKET_FIELDS.map((_, i) => fieldFilled(STAMPED, i))).toEqual([true, true, true, true]);
  });

  it("marks the headline sorted after the stamp lands", () => {
    expect(TICKET_SORTED_MS).toBeGreaterThan(TICKET_BEATS[STAMPED - 1]);
  });
});
