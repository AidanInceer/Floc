import { describe, expect, it } from "vitest";

import { matchLabel, NO_MATCH_LINE, SUGGESTION_SOURCES } from "./match-words";

describe("the words for a match", () => {
  it("says the figure and the word match, and gives no reason", () => {
    expect(matchLabel(86)).toBe("86% match");
  });

  it("asks for a travel style when there is no figure", () => {
    expect(NO_MATCH_LINE).toContain("travel style");
  });

  it("names every source that feeds a suggestion", () => {
    for (const source of ["travel style", "trips you saved", "countries you want to go to", "last 10 finished trips", "what you spent"]) expect(SUGGESTION_SOURCES).toContain(source);
  });
});
