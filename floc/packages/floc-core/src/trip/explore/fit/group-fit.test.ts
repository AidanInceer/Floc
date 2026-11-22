import { describe, expect, it } from "vitest";

import { groupFits, groupIdeas, withoutSpend } from "./group-fit";
import type { TravelProfile } from "./travel-profile";

describe("a group's match (#177, ADR-074)", () => {
  it("is one member's own figures when the group is one person", () => {
    expect(groupFits([{ lisbon: 80, kyoto: 40 }])).toEqual({ lisbon: 80, kyoto: 40 });
  });

  it("is the same figure when every member agrees", () => {
    expect(groupFits([{ lisbon: 70 }, { lisbon: 70 }, { lisbon: 70 }])).toEqual({ lisbon: 70 });
  });

  it("ranks a trip everyone half likes above one that fits a member badly", () => {
    const fits = groupFits([
      { split: 90, steady: 60 },
      { split: 20, steady: 60 },
    ]);
    expect(fits.steady).toBe(60);
    expect(fits.split).toBeLessThan(fits.steady);
    expect(fits.split).toBeLessThan(55);
  });

  it("never goes below nought", () => {
    expect(groupFits([{ far: 100 }, { far: 0 }, { far: 0 }]).far).toBeGreaterThanOrEqual(0);
  });

  it("leaves a member out of a trip they have no figure for", () => {
    expect(groupFits([{ lisbon: 80, kyoto: 50 }, { lisbon: 80 }])).toEqual({ lisbon: 80, kyoto: 50 });
  });

  it("has no figures for a group with nobody in it", () => {
    expect(groupFits([])).toEqual({});
  });
});

describe("a group's trip ideas", () => {
  const order = ["lisbon", "kyoto", "oaxaca", "tbilisi"];

  it("lists the best matches first, up to the limit", () => {
    expect(groupIdeas({ lisbon: 50, kyoto: 90, oaxaca: 70, tbilisi: 10 }, order, 3)).toEqual([
      { presetId: "kyoto", match: 90 },
      { presetId: "oaxaca", match: 70 },
      { presetId: "lisbon", match: 50 },
    ]);
  });

  it("keeps Explore's order between equal matches", () => {
    expect(groupIdeas({ tbilisi: 60, lisbon: 60, kyoto: 60 }, order, 2).map((idea) => idea.presetId)).toEqual(["lisbon", "kyoto"]);
  });

  it("skips a listing with no figure", () => {
    expect(groupIdeas({ kyoto: 40 }, order, 10)).toEqual([{ presetId: "kyoto", match: 40 }]);
  });
});

describe("a member's profile inside a group (ADR-057)", () => {
  const profile: TravelProfile = {
    vibes: ["food"],
    stay: "mid",
    pace: "balanced",
    saved: ["lisbon"],
    wantToGo: ["JP"],
    past: [{ nights: 7, countries: ["PT"], stops: 2, moves: ["train"], spend: [{ currency: "GBP", minor: 84000 }] }],
  };

  it("drops what they spent and keeps the rest", () => {
    const bare = withoutSpend(profile);
    expect(bare.past).toEqual([{ nights: 7, countries: ["PT"], stops: 2, moves: ["train"], spend: [] }]);
    expect({ ...bare, past: [] }).toEqual({ ...profile, past: [] });
  });
});
