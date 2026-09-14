import { describe, expect, it } from "vitest";

import { llmsTxt } from "./llms-txt";

describe("llmsTxt", () => {
  const text = llmsTxt("https://floc.example");

  it("opens with the name as a heading and a one-line summary", () => {
    expect(text).toMatch(/^# Floc\n\n> .+\n/);
  });

  it("links public pages as absolute urls", () => {
    expect(text).toContain("[Explore](https://floc.example/explore)");
    expect(text).toContain("[Privacy policy](https://floc.example/privacy)");
  });

  it("lists features without the ones sold as Pro", () => {
    expect(text).toContain("Split the bill, not the group");
    expect(text).not.toContain("The weather, in advance");
  });

  it("never points an agent at a signed-in page", () => {
    expect(text).not.toMatch(/floc\.example\/(trips?|friends|profile|settings)\b/);
  });
});
