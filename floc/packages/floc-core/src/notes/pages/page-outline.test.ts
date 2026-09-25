import { describe, expect, it } from "vitest";

import { bulletShape, canFold, hiddenLines, listNumbers, numberLabel, sectionEnd, type OutlineLine } from "./page-outline";

const n = (indent: number): OutlineLine => ({ type: "numbered", indent });
const h = (level: number, id: string): OutlineLine => ({ type: "heading", level, id, indent: 0 });
const p: OutlineLine = { type: "paragraph", indent: 0 };

describe("numberLabel", () => {
  it("counts 1, a, i by depth, and round again at depth three", () => {
    expect([numberLabel(3, 0), numberLabel(3, 1), numberLabel(4, 2), numberLabel(2, 3)]).toEqual(["3", "c", "iv", "2"]);
    expect([numberLabel(27, 1), numberLabel(19, 2)]).toEqual(["a", "xix"]);
  });
});

describe("listNumbers", () => {
  it("numbers each depth on its own and keeps an outer count across a deeper line", () => {
    expect(listNumbers([n(0), n(1), n(1), { type: "bullet", indent: 1 }, n(0), n(2), p, n(0)])).toEqual([
      "1.", "a.", "b.", null, "2.", "i.", null, "1.",
    ]);
  });
});

describe("bulletShape", () => {
  it("changes shape with depth", () => {
    expect([0, 1, 2, 3].map(bulletShape)).toEqual(["dot", "ring", "square", "dot"]);
  });
});

describe("folding", () => {
  const lines = [h(1, "a"), p, h(2, "b"), p, h(3, "c"), h(2, "d"), p, h(1, "e"), p];

  it("ends a section at the next heading of the same or a higher level", () => {
    expect(sectionEnd(lines, 0)).toBe(7);
    expect(sectionEnd(lines, 2)).toBe(5);
    expect(sectionEnd(lines, 4)).toBe(5);
    expect(sectionEnd(lines, 1)).toBe(2);
    expect(sectionEnd([{ type: "heading", indent: 0 }, p, h(2, "x")], 0)).toBe(2);
  });

  it("hides the lines under a folded heading, and nothing else", () => {
    expect(hiddenLines(lines, new Set(["b"]))).toEqual([false, false, false, true, true, false, false, false, false]);
    expect(hiddenLines(lines, new Set(["a", "e"]))).toEqual([false, true, true, true, true, true, true, false, true]);
    expect(hiddenLines(lines, new Set())).toEqual(lines.map(() => false));
  });

  it("offers a fold only on a heading with lines under it", () => {
    expect(canFold(lines, 0)).toBe(true);
    expect(canFold(lines, 4)).toBe(false);
    expect(canFold(lines, 1)).toBe(false);
  });
});
