/**
 * The travel map's merge rules (ticket 95) — the pure half of lib/travel-map.ts.
 * Everything contentious about this feature is decided in `mergeMarks`, so it
 * is worth pinning down without a database.
 */
import { describe, expect, it } from "vitest";

import { readCountryCode } from "./countries";
import { mergeMarks } from "./travel-map";

describe("mergeMarks", () => {
  it("draws what the trips say when nothing is hand-painted", () => {
    const map = mergeMarks({ ES: "green", JP: "yellow" }, {});
    expect(map.states).toEqual({ ES: "green", JP: "yellow" });
    expect(map.visited).toBe(1);
    expect(map.wantToGo).toBe(1);
  });

  it("keeps a hand-green country green through an upcoming trip", () => {
    // The case the maintainer raised: been to Japan, going again next month.
    // A trip may not demote you.
    const map = mergeMarks({ JP: "yellow" }, { JP: "green" });
    expect(map.states.JP).toBe("green");
  });

  it("treats `none` as a rejection, not as a gap", () => {
    // The trip's dates passed, so it claims green — and it's wrong, because
    // the trip was cancelled. The map has to be able to say so.
    const map = mergeMarks({ ES: "green" }, { ES: "none" });
    expect(map.states.ES).toBeUndefined();
    expect(map.visited).toBe(0);
  });

  it("keeps a hand mark on a country no trip mentions", () => {
    const map = mergeMarks({}, { MN: "yellow" });
    expect(map.states).toEqual({ MN: "yellow" });
  });

  it("counts what is drawn, not what is stored", () => {
    const map = mergeMarks(
      { ES: "green", FR: "green", JP: "yellow" },
      { ES: "none", IT: "yellow" },
    );
    expect(map.states).toEqual({ FR: "green", JP: "yellow", IT: "yellow" });
    expect(map.visited).toBe(1);
    expect(map.wantToGo).toBe(2);
  });

  it("hands the manual rows back untouched for the editor", () => {
    const manual = { ES: "none", IT: "yellow" } as const;
    expect(mergeMarks({}, manual).manual).toEqual(manual);
  });
});

describe("readCountryCode", () => {
  it("normalises Nominatim's lower-case codes", () => {
    expect(readCountryCode("gb")).toBe("GB");
    expect(readCountryCode(" jp ")).toBe("JP");
  });

  it("refuses anything the map has no shape for", () => {
    // Nominatim returns codes for territories Natural Earth doesn't draw, and
    // a code with no polygon would paint nothing while counting as marked.
    expect(readCountryCode("XX")).toBeNull();
    expect(readCountryCode("")).toBeNull();
    expect(readCountryCode(null)).toBeNull();
    expect(readCountryCode(42)).toBeNull();
  });

  it("has the small states the 1:110m outlines drop", () => {
    // They come in as points rather than polygons — see build-countries.mjs.
    expect(readCountryCode("sg")).toBe("SG");
    expect(readCountryCode("mt")).toBe("MT");
  });
});
