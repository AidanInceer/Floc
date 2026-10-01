import { describe, expect, it } from "vitest";

import { legalLinkFor, riseFrom } from "./legal-sheet";

describe("legalLinkFor", () => {
  it("finds the legal page a path shows", () => {
    expect(legalLinkFor("/cookies")).toEqual({ href: "/cookies", label: "Cookies" });
  });

  it("has nothing for a path that is not a legal page", () => {
    expect(legalLinkFor("/trips")).toBeNull();
    expect(legalLinkFor("/privacy/extra")).toBeNull();
  });
});

describe("riseFrom", () => {
  it("starts the sheet where the footer row sits", () => {
    expect(riseFrom({ barTop: 780, sheetTop: 56, viewport: 900 })).toBe(724);
  });

  it("rises from the bottom edge when the footer is out of view", () => {
    expect(riseFrom({ barTop: 1400, sheetTop: 56, viewport: 900 })).toBe(844);
    expect(riseFrom({ barTop: null, sheetTop: 56, viewport: 900 })).toBe(844);
  });

  it("never starts above its resting place", () => {
    expect(riseFrom({ barTop: 20, sheetTop: 56, viewport: 900 })).toBe(0);
  });
});
