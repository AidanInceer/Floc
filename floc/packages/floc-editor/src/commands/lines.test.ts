import { describe, expect, it } from "vitest";
import { TextSelection } from "@tiptap/pm/state";

import { backspaceAtStart, indentLines, splitLine } from "./lines";
import { caretBlock, caretIn, line, lines, page, run, table } from "./testing";

describe("indentLines", () => {
  it("indents and outdents the line, up to three and down to none", () => {
    let state = caretIn(page(line("bullet", "a")), 0);
    for (let i = 0; i < 4; i += 1) state = run(indentLines(1), state).state;
    expect(lines(state)).toEqual(["bullet:3:a"]);
    expect(run(indentLines(1), state).ok).toBe(false);
    state = run(indentLines(-1), state).state;
    expect(lines(state)).toEqual(["bullet:2:a"]);
  });

  it("indents every selected line", () => {
    const doc = page(line("bullet", "a"), line("bullet", "b"), line("paragraph", "c"));
    const state = caretIn(doc, 0);
    const across = state.apply(state.tr.setSelection(TextSelection.create(doc, 1, doc.content.size - 1)));
    expect(lines(run(indentLines(1), across).state)).toEqual(["bullet:1:a", "bullet:1:b", "paragraph:1:c"]);
  });

  it("leaves Tab to the table inside a cell", () => {
    expect(run(indentLines(1), caretIn(page(table([["a"]])), 0, 2)).ok).toBe(false);
  });
});

describe("splitLine", () => {
  it("continues a list at the same indent, with the tick cleared", () => {
    const state = caretIn(page(line("check", "Flights", { indent: 1, checked: true })), 0, 7);
    const next = run(splitLine(), state).state;
    expect(lines(next)).toEqual(["check:1:Flights", "check:1:"]);
    expect(next.doc.child(1).attrs.checked).toBe(false);
    expect(caretBlock(next)).toBe(1);
  });

  it("carries the words after the caret to the new line", () => {
    const next = run(splitLine(), caretIn(page(line("numbered", "onetwo")), 0, 3)).state;
    expect(lines(next)).toEqual(["numbered:0:one", "numbered:0:two"]);
  });

  it("starts a paragraph after a heading or a quote", () => {
    expect(lines(run(splitLine(), caretIn(page(line("heading", "Ideas", { level: 2 })), 0, 5)).state)).toEqual(["heading:0:Ideas", "paragraph:0:"]);
    expect(lines(run(splitLine(), caretIn(page(line("quote", "q")), 0, 1)).state)).toEqual(["quote:0:q", "paragraph:0:"]);
  });

  it("outdents an empty list line, then ends the list", () => {
    let state = caretIn(page(line("bullet", "a"), line("bullet", "", { indent: 1 })), 1);
    state = run(splitLine(), state).state;
    expect(lines(state)).toEqual(["bullet:0:a", "bullet:0:"]);
    state = run(splitLine(), state).state;
    expect(lines(state)).toEqual(["bullet:0:a", "paragraph:0:"]);
  });

  it("puts the new line after a folded heading's section, so it is not hidden", () => {
    const doc = page(line("heading", "To book", { level: 2, id: "h" }), line("paragraph", "under"), line("heading", "Ideas", { level: 2, id: "i" }));
    const next = run(splitLine(new Set(["h"])), caretIn(doc, 0, 7)).state;
    expect(lines(next)).toEqual(["heading:0:To book", "paragraph:0:under", "paragraph:0:", "heading:0:Ideas"]);
    expect(caretBlock(next)).toBe(2);
  });

  it("leaves Enter alone in a table and inside a selection that spans lines", () => {
    expect(run(splitLine(), caretIn(page(table([["a"]])), 0, 2)).ok).toBe(false);
    const doc = page(line("paragraph", "a"), line("paragraph", "b"));
    const state = caretIn(doc, 0);
    expect(run(splitLine(), state.apply(state.tr.setSelection(TextSelection.create(doc, 1, 5)))).ok).toBe(false);
  });
});

describe("backspaceAtStart", () => {
  it("outdents first, then turns the line into text, then leaves joining to the editor", () => {
    let state = caretIn(page(line("paragraph", "x"), line("check", "a", { indent: 1, checked: true })), 1);
    state = run(backspaceAtStart, state).state;
    expect(lines(state)).toEqual(["paragraph:0:x", "check:0:a"]);
    state = run(backspaceAtStart, state).state;
    expect(lines(state)).toEqual(["paragraph:0:x", "paragraph:0:a"]);
    expect(run(backspaceAtStart, state).ok).toBe(false);
  });

  it("removes a divider just above", () => {
    const state = caretIn(page(line("paragraph", "x"), line("divider"), line("paragraph", "a")), 2);
    const next = run(backspaceAtStart, state).state;
    expect(lines(next)).toEqual(["paragraph:0:x", "paragraph:0:a"]);
    expect(caretBlock(next)).toBe(1);
  });

  it("does nothing away from the start of a line", () => {
    expect(run(backspaceAtStart, caretIn(page(line("bullet", "ab", { indent: 1 })), 0, 1)).ok).toBe(false);
    expect(run(backspaceAtStart, caretIn(page(table([["a"]])), 0, 2)).ok).toBe(false);
  });
});
