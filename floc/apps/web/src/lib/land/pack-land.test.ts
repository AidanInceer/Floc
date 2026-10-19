import { describe, expect, it } from "vitest";

import { packLand, simplify } from "./pack-land";

const square = (x: number, y: number, side: number) => [[x, y], [x + side, y], [x + side, y + side], [x, y + side], [x, y]];
const country = (props: Record<string, string>, coordinates: unknown, type = "Polygon") => ({ properties: props, geometry: { type, coordinates } });

describe("simplify", () => {
  it("drops a point that sits on the line between its neighbours", () => {
    expect(simplify([[0, 0], [1, 0.001], [2, 0], [2, 2], [0, 2], [0, 0]], 0.01)).toEqual([[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]);
  });

  it("keeps a point further off the line than the tolerance", () => {
    expect(simplify([[0, 0], [1, 0.5], [2, 0], [2, 2], [0, 2], [0, 0]], 0.01)).toContainEqual([1, 0.5]);
  });
});

describe("packLand", () => {
  it("packs a ring as its first point and each step after, in whole hundredths of a degree", () => {
    const packed = packLand({ features: [country({ ISO_A2_EH: "ES", ADM0_A3: "ESP" }, [square(-9.001, 36, 8)])] });
    expect(packed.ES).toEqual([[-900, 3600, 800, 0, 0, 800, -800, 0, 0, -800]]);
  });

  it("packs each part of a multi-polygon, outer rings only", () => {
    const packed = packLand({ features: [country({ ISO_A2_EH: "NZ", ADM0_A3: "NZL" }, [[square(172, -41, 4), square(173, -40, 1)], [square(166, -47, 6)]], "MultiPolygon")] });
    expect(packed.NZ).toHaveLength(2);
  });

  it("folds a disputed area into the state it is recognised as part of", () => {
    const packed = packLand({ features: [country({ ISO_A2_EH: "-99", ADM0_A3: "CYN" }, [square(33, 35, 1)])] });
    expect(Object.keys(packed)).toEqual(["CY"]);
  });

  it("leaves out a feature with no country code, and a ring too small to keep", () => {
    const packed = packLand({
      features: [country({ ISO_A2_EH: "-99", ADM0_A3: "KOS" }, [square(20, 42, 1)]), country({ ISO_A2_EH: "MC", ADM0_A3: "MCO" }, [square(7.41, 43.72, 0.001)])],
    });
    expect(packed).toEqual({});
  });
});
