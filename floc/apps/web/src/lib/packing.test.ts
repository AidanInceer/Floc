import { describe, expect, it } from "vitest";

import {
  packingStatus,
  packingStatusLabel,
  clampPackQuantity,
  parsePackTier,
  parseQuantityStep,
  resolvePackTier,
} from "@/lib/packing";

const packed = { packedAt: new Date() };
const open = { packedAt: null };

describe("packingStatus", () => {
  it("is unclaimed when nobody has taken it on", () => {
    expect(packingStatus([])).toBe("unclaimed");
  });

  it("is claimed while any claimer still has it outstanding", () => {
    expect(packingStatus([open])).toBe("claimed");
    expect(packingStatus([packed, open])).toBe("claimed");
  });

  it("is packed only once every claimer has ticked", () => {
    expect(packingStatus([packed, packed])).toBe("packed");
  });
});

describe("packingStatusLabel", () => {
  it("counts nothing when one person is carrying the line", () => {
    expect(packingStatusLabel([])).toBe("Unclaimed");
    expect(packingStatusLabel([open])).toBe("Claimed");
    expect(packingStatusLabel([packed])).toBe("Packed");
  });

  it("counts how many claimers have packed once there are several", () => {
    expect(packingStatusLabel([packed, open, open])).toBe("1 of 3 packed");
    expect(packingStatusLabel([open, open])).toBe("0 of 2 packed");
  });

  it("drops the count again once every claimer has packed", () => {
    expect(packingStatusLabel([packed, packed, packed])).toBe("Packed");
  });
});

describe("resolvePackTier", () => {
  it("uses the profile default until a trip says otherwise", () => {
    expect(resolvePackTier(null, "balanced")).toBe("balanced");
    expect(resolvePackTier(null, "comfort")).toBe("comfort");
  });

  it("lets the trip's own choice win", () => {
    expect(resolvePackTier("light", "comfort")).toBe("light");
  });
});

describe("parsePackTier", () => {
  it("takes the three tiers and nothing else", () => {
    expect(parsePackTier("light")).toBe("light");
    expect(parsePackTier("Light")).toBeNull();
    expect(parsePackTier("featherweight")).toBeNull();
    expect(parsePackTier(undefined)).toBeNull();
  });
});

describe("clampPackQuantity", () => {
  it("holds the count between one and ninety-nine", () => {
    expect(clampPackQuantity(0)).toBe(1);
    expect(clampPackQuantity(-4)).toBe(1);
    expect(clampPackQuantity(5)).toBe(5);
    expect(clampPackQuantity(500)).toBe(99);
  });

  it("refuses fractions and nonsense", () => {
    expect(clampPackQuantity(2.7)).toBe(2);
    expect(clampPackQuantity(Number.NaN)).toBe(1);
  });
});

describe("parseQuantityStep", () => {
  it("takes one step either way and nothing else", () => {
    expect(parseQuantityStep("1")).toBe(1);
    expect(parseQuantityStep("-1")).toBe(-1);
    expect(parseQuantityStep("7")).toBeNull();
    expect(parseQuantityStep(undefined)).toBeNull();
  });
});
