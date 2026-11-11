import { describe, expect, it } from "vitest";

import { BEATS, CLAIMED, DATED, FLIGHT_MS, playingCard, ROUTED, SETTLED, SPENT, SPUN, VOTED } from "./beats";

const at = (step: number) => BEATS[step - 1]!;

describe("hero beats", () => {
  it("play in order", () => {
    expect([...BEATS]).toEqual([...BEATS].sort((a, b) => a - b));
  });

  it("gate each card on the one before it, left to right", () => {
    expect([VOTED, DATED, ROUTED, SPENT, SETTLED, SPUN, CLAIMED]).toEqual([...[VOTED, DATED, ROUTED, SPENT, SETTLED, SPUN, CLAIMED]].sort((a, b) => a - b));
    expect(at(DATED) - at(VOTED)).toBeGreaterThanOrEqual(500);
    expect(at(ROUTED) - at(DATED)).toBeGreaterThanOrEqual(1300);
    expect(at(SPENT) - at(ROUTED)).toBeGreaterThanOrEqual(1600);
    expect(at(SPUN) - at(SETTLED)).toBeGreaterThanOrEqual(1100);
  });

  it("fly the plane from the first beat until the last reel locks", () => {
    expect(BEATS[0] + FLIGHT_MS).toBeGreaterThan(at(CLAIMED));
  });

  it("name the card playing at each step, and none before the start or once the last reel locks", () => {
    expect(playingCard(0)).toBeNull();
    expect(playingCard(1)).toBe("votes");
    expect(playingCard(VOTED)).toBe("votes");
    expect(playingCard(DATED)).toBe("dates");
    expect(playingCard(ROUTED)).toBe("ticket");
    expect(playingCard(SPENT)).toBe("money");
    expect(playingCard(SETTLED)).toBe("money");
    expect(playingCard(SPUN)).toBe("pack");
    expect(playingCard(CLAIMED)).toBeNull();
  });
});
