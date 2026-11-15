import { describe, expect, it } from "vitest";

import { CONSENT_CATEGORIES, CONSENT_COOKIE } from "@floc/core/consent/consent";

import { FUNCTIONAL_KEYS, FUNCTIONAL_PREFIXES } from "../storage/functional-keys";
import { THEME_STORAGE_KEY } from "../theme";
import { STORAGE_CATEGORIES, STORAGE_LIST } from "./storage-list";

const names = (category: string) => STORAGE_LIST.filter((s) => s.category === category).map((s) => s.name);

describe("the list of what Floc stores on a device", () => {
  it("names every key that waits for a yes, and nothing else, as functional", () => {
    expect(names("functional").sort()).toEqual([...FUNCTIONAL_KEYS, ...FUNCTIONAL_PREFIXES.map((prefix) => `${prefix}…`)].sort());
  });

  it("names the consent cookie and the theme", () => {
    expect(names("necessary")).toEqual(expect.arrayContaining([CONSENT_COOKIE, THEME_STORAGE_KEY]));
  });

  it("has no cookie that lasts longer than twelve months", () => {
    for (const thing of STORAGE_LIST.filter((s) => s.kind === "Cookie")) expect(thing.days).toBeLessThanOrEqual(365);
  });

  it("has no advertising or analytics storage: page views are counted with no cookie", () => {
    expect(new Set(STORAGE_LIST.map((s) => s.category))).toEqual(new Set(["necessary", "functional"]));
  });
});

describe("the cookie policy, by category", () => {
  it("has one row for each consent category, in the banner order", () => {
    expect(STORAGE_CATEGORIES.map((row) => row.key)).toEqual(CONSENT_CATEGORIES.map((c) => c.key));
  });

  it("takes the strictly necessary duration from the longest necessary cookie", () => {
    expect(STORAGE_CATEGORIES.find((row) => row.key === "necessary")?.duration).toContain("12 months");
  });

  it("says which categories need consent", () => {
    expect(STORAGE_CATEGORIES.map((row) => row.consent)).toEqual(["Not required", "Required", "Required"]);
  });
});
