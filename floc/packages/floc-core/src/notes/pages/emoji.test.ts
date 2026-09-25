import { describe, expect, it } from "vitest";

import { EMOJI, findEmoji } from "./emoji";

describe("findEmoji", () => {
  it("finds by the start of any word, named by the first", () => {
    expect(findEmoji("suit")).toEqual([{ emoji: "🧳", name: "luggage" }]);
    expect(findEmoji("money").map((choice) => choice.name)).toEqual(["euro", "pound"]);
  });

  it("lists the first forty with no query, and none for nonsense", () => {
    expect(findEmoji("")).toHaveLength(40);
    expect(findEmoji(" ", 100)).toHaveLength(EMOJI.length);
    expect(findEmoji("zzz")).toEqual([]);
  });
});
