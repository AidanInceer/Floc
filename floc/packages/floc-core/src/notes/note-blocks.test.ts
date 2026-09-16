import { describe, expect, it } from "vitest";

import {
  blockText,
  headingLevel,
  inlineRuns,
  isChecked,
  isDrawn,
  type NoteBlock,
} from "./note-blocks";

/** A document shaped the way BlockNote actually saves one. */
const WEB_DOC: NoteBlock[] = [
  {
    id: "a",
    type: "heading",
    props: { level: 2, textColor: "default" },
    content: [{ type: "text", text: "Getting around", styles: {} }],
    children: [],
  },
  {
    id: "b",
    type: "bulletListItem",
    props: {},
    content: [
      { type: "text", text: "JR pass — ", styles: {} },
      { type: "text", text: "book before we fly", styles: { backgroundColor: "yellow" } },
    ],
    children: [],
  },
  {
    id: "c",
    type: "checkListItem",
    props: { checked: true },
    content: [{ type: "text", text: "Suica card", styles: {} }],
    children: [],
  },
];

describe("reading a block", () => {
  it("flattens every run into one string", () => {
    const [, bullet] = WEB_DOC;
    expect(blockText(bullet)).toBe("JR pass — book before we fly");
  });

  it("keeps a highlight's styles so it can be drawn", () => {
    const [, bullet] = WEB_DOC;
    expect(inlineRuns(bullet)[1].styles).toEqual({ backgroundColor: "yellow" });
  });

  it("brings a link's href out with its text", () => {
    const block: NoteBlock = {
      type: "paragraph",
      content: [
        { type: "link", href: "https://example.com", content: [{ type: "text", text: "here" }] },
      ],
    };
    expect(inlineRuns(block)).toEqual([
      { text: "here", styles: {}, href: "https://example.com" },
    ]);
  });

  // BlockNote has written plain strings and bare blocks over its versions; a
  // note saved by an older editor must still read.
  it("copes with content that is a bare string, missing, or an empty run", () => {
    expect(blockText({ type: "paragraph", content: "just text" })).toBe("just text");
    expect(inlineRuns({ type: "paragraph" })).toEqual([]);
    expect(blockText({ type: "paragraph", content: [{ type: "text" }] })).toBe("");
  });

  it("treats a link with no inner content as no runs", () => {
    expect(inlineRuns({ type: "paragraph", content: [{ type: "link", href: "x" }] })).toEqual([]);
  });

  it("knows which blocks it can draw", () => {
    expect(isDrawn({ type: "paragraph" })).toBe(true);
    expect(isDrawn({})).toBe(false);
  });

  it("reads a checkbox and a heading level", () => {
    const blocks = WEB_DOC;
    expect(isChecked(blocks[2])).toBe(true);
    expect(headingLevel(blocks[0])).toBe(2);
  });

  it("falls back to the smallest heading when the level is missing", () => {
    expect(headingLevel({ type: "heading" })).toBe(3);
  });
});

describe("what the phone draws", () => {
  it("leaves a table undrawn and reads a box with no props as unticked", () => {
    expect(isDrawn({ type: "table" })).toBe(false);
    expect(isChecked({ type: "checkListItem" })).toBe(false);
  });
});
