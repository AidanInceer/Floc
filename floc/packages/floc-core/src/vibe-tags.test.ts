import { describe, expect, it } from "vitest";

import { VIBE_TAGS, parseVibeTags, readVibeTags } from "./vibe-tags";

describe("vibe tags", () => {
  it("refuses a tag that isn't in the vocabulary", () => {
    expect(parseVibeTags(["beaches", "cave diving"])).toEqual(["beaches"]);
  });

  it("normalises what a form sends", () => {
    expect(parseVibeTags(["  Beaches  "])).toEqual(["beaches"]);
  });

  it("keeps one of a repeated tag", () => {
    expect(parseVibeTags(["hiking", "hiking"])).toEqual(["hiking"]);
  });

  it("lets you pick the whole vocabulary — there is no cap", () => {
    expect(parseVibeTags([...VIBE_TAGS])).toEqual([...VIBE_TAGS]);
  });

  it("survives a column holding something that isn't a list", () => {
    expect(readVibeTags(null)).toEqual([]);
    expect(readVibeTags("beaches")).toEqual([]);
  });

  it("drops a tag that has since left the vocabulary", () => {
    expect(readVibeTags(["beaches", "slow travel", 7])).toEqual(["beaches"]);
  });
});
