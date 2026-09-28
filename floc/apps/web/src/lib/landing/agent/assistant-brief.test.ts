import { describe, expect, it } from "vitest";

import { PROMPT_TEXT } from "./agent-prompt";
import { ASSISTANTS, BRIEF_MAX, askHref, briefFor } from "./assistant-brief";

const ORIGIN = "https://floc.example";

describe("briefFor", () => {
  it("points the assistant back to Floc, then gives the guidance and asks for a day-first plan", () => {
    expect(briefFor(ORIGIN, "Lisbon for four, early May.")).toBe(
      "Plan a trip with Floc (https://floc.example) based on the following guidance:\n\n" +
        "Lisbon for four, early May.\n\n" +
        "Lay it out day by day, with where we sleep each night, so we can add it to our Floc trip.",
    );
  });

  it("trims the guidance", () => {
    expect(briefFor(ORIGIN, "  Lisbon.\n\n")).toContain("guidance:\n\nLisbon.\n\nLay it out");
  });

  it("sends the Sicily sample when the guidance is left empty, as the box shows it", () => {
    expect(briefFor(ORIGIN, "   ")).toContain(`guidance:\n\n${PROMPT_TEXT}\n\n`);
  });

  it("caps the guidance so the link stays a length every assistant accepts", () => {
    const brief = briefFor(ORIGIN, "a".repeat(BRIEF_MAX + 50));
    expect(brief).toContain(`${"a".repeat(BRIEF_MAX)}\n\n`);
    expect(brief).not.toContain("a".repeat(BRIEF_MAX + 1));
  });
});

describe("askHref", () => {
  it("opens the assistant with the brief already in", () => {
    const claude = ASSISTANTS.find((a) => a.key === "claude")!;
    expect(askHref(claude, "Plan Sicily & more?")).toBe("https://claude.ai/new?q=Plan%20Sicily%20%26%20more%3F");
  });

  it("only lists assistants that take the brief in the link, over https", () => {
    expect(ASSISTANTS.map((a) => a.name)).toEqual(["ChatGPT", "Claude", "Grok", "Le Chat", "Perplexity"]);
    ASSISTANTS.forEach((a) => expect(a.ask).toMatch(/^https:\/\/[^?]+\?q=$/));
  });
});
