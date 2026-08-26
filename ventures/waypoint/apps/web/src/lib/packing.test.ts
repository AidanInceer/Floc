import { describe, expect, it } from "vitest";

import { packingStatus, packingStatusLabel } from "@/lib/packing";

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
