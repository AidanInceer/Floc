import { describe, expect, it } from "vitest";

import {
  MAX_TAGS,
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

  it("keeps at most five tags", () => {
    expect(parseTags("a, b, c, d, e, f, g")).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("truncates an over-long tag rather than rejecting the lot", () => {
    expect(parseTags("a".repeat(40))[0]).toHaveLength(24);
  });

  it("reads tags as the field shows them", () => {
    expect(parseTags("beach, stag")).toEqual(["beach", "stag"]);
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

  it("shows only the first five of a row saved under the old limit of eight", () => {
    expect(readTags(["a", "b", "c", "d", "e", "f", "g", "h"])).toEqual(["a", "b", "c", "d", "e"]);
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
