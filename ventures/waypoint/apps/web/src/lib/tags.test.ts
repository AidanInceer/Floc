import { describe, expect, it } from "vitest";

import {
  DEFAULT_TAG_TONE,
  MAX_TAGS,
  formatTags,
  parseTagRows,
  parseTags,
  readTagTones,
  readTags,
  tagTone,
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

describe("tag colours (ticket 86)", () => {
  it("survives a column holding anything at all", () => {
    expect(readTagTones(null)).toEqual({});
    expect(readTagTones(["beach"])).toEqual({});
    expect(readTagTones({ beach: "green", stag: "marine" })).toEqual({
      stag: "marine",
    });
  });

  it("falls back to the default colour for an uncoloured tag", () => {
    expect(tagTone({ stag: "marine" }, "stag")).toBe("marine");
    expect(tagTone({}, "beach")).toBe(DEFAULT_TAG_TONE);
  });

  it("stores only non-default colours", () => {
    expect(
      parseTagRows([
        { name: "Beach", tone: "marine" },
        { name: "stag", tone: "open" },
      ]),
    ).toEqual({ tags: ["beach", "stag"], tagTones: { beach: "marine" } });
  });

  it("ignores a colour that isn't one of ours", () => {
    expect(parseTagRows([{ name: "beach", tone: "chartreuse" }])).toEqual({
      tags: ["beach"],
      tagTones: {},
    });
  });

  it("drops blank rows and duplicates, and caps the count", () => {
    expect(
      parseTagRows([
        { name: "  ", tone: "open" },
        { name: "beach", tone: "open" },
        { name: "BEACH", tone: "action" },
      ]).tags,
    ).toEqual(["beach"]);

    const many = Array.from({ length: MAX_TAGS + 3 }, (_, i) => ({
      name: `t${i}`,
      tone: "open",
    }));
    expect(parseTagRows(many).tags).toHaveLength(MAX_TAGS);
  });
});
