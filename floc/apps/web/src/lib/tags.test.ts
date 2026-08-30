import { describe, expect, it } from "vitest";

import {
  MAX_TAGS,
  formatTags,
  parseTagNames,
  parseTags,
  readTags,
} from "./tags";

describe("parseTags", () => {
  it("lower-cases, trims and drops blanks", () => {
    expect(parseTags(" Beach , ,  STAG ")).toEqual(["beach", "stag"]);
  });

  it("collapses inner whitespace so one label is one tag", () => {
    expect(parseTags("with   kids")).toEqual(["with kids"]);
  });

  it("keeps first mention and drops duplicates", () => {
    expect(parseTags("beach, Beach, beach")).toEqual(["beach"]);
  });

  it("caps the count", () => {
    const many = Array.from({ length: MAX_TAGS + 4 }, (_, i) => `t${i}`).join(",");
    expect(parseTags(many)).toHaveLength(MAX_TAGS);
  });

  it("truncates an over-long tag rather than rejecting the lot", () => {
    expect(parseTags("a".repeat(40))[0]).toHaveLength(24);
  });

  it("round-trips through the field", () => {
    expect(parseTags(formatTags(["beach", "stag"]))).toEqual(["beach", "stag"]);
  });

  it("treats nothing as no tags", () => {
    expect(parseTags(null)).toEqual([]);
    expect(parseTags("")).toEqual([]);
  });
});

describe("readTags", () => {
  it("survives a column holding something that isn't a string array", () => {
    expect(readTags(null)).toEqual([]);
    expect(readTags("beach")).toEqual([]);
    expect(readTags(["beach", 3, "", "stag"])).toEqual(["beach", "stag"]);
  });
});

describe("parseTagNames (ticket 213: names only, one colour per trip)", () => {
  it("normalises, drops blank rows and duplicates", () => {
    expect(parseTagNames(["  ", "Beach", "BEACH"])).toEqual(["beach"]);
  });

  it("caps the count", () => {
    const many = Array.from({ length: MAX_TAGS + 3 }, (_, i) => `t${i}`);
    expect(parseTagNames(many)).toHaveLength(MAX_TAGS);
  });
});

describe("formatTags", () => {
  it("reads an absent tag list as no tags at all", () => {
    expect(formatTags(null)).toBe("");
    expect(formatTags(undefined)).toBe("");
  });
});
