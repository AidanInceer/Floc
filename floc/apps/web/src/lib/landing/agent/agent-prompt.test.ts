import { describe, expect, it } from "vitest";

import { PROMPT_TEXT, typePrompt } from "./agent-prompt";

const chars = (start: number) => typePrompt(start).lines.flat().flatMap((p) => p.chars);

describe("typePrompt", () => {
  it("types every character of the brief, in order", () => {
    const typed = typePrompt(0).lines.map((line) => line.flatMap((p) => p.chars.map((c) => c.ch)).join("")).join(" ");
    expect(typed).toBe(PROMPT_TEXT);
  });

  it("starts on the first key and never goes back in time", () => {
    const all = chars(300);
    expect(all[0]!.at).toBe(300);
    all.slice(1).forEach((c, i) => expect(c.at).toBeGreaterThan(all[i]!.at));
  });

  it("waits longer after a full stop than after a comma, and longer after a comma than a letter", () => {
    const all = chars(0);
    const gapAfter = (ch: string) => {
      const i = all.findIndex((c) => c.ch === ch);
      return all[i + 1]!.at - all[i]!.at;
    };
    expect(gapAfter(".")).toBeGreaterThan(gapAfter(","));
    expect(gapAfter(",")).toBeGreaterThan(gapAfter("P"));
  });

  it("marks each of the six asks once", () => {
    const marks = typePrompt(0).lines.flat().flatMap((p) => (p.mark ? [p.mark] : []));
    expect(marks).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("ends after the last key", () => {
    const { endMs } = typePrompt(0);
    expect(endMs).toBeGreaterThan(chars(0).at(-1)!.at);
  });
});
