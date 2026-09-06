import { describe, expect, it } from "vitest";

import {
  blockText,
  headingLevel,
  inlineRuns,
  isChecked,
  isDrawn,
  newBlock,
  parseNoteDoc,
  serialiseNoteDoc,
  setBlockText,
  setChecked,
  type NoteBlock,
} from "./note-blocks";

/** A document shaped the way BlockNote actually saves one. */
const WEB_DOC = JSON.stringify([
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
]);

describe("parseNoteDoc", () => {
  it("reads a document the web app wrote", () => {
    expect(parseNoteDoc(WEB_DOC)).toHaveLength(3);
  });

  // An empty note is the ordinary starting state, not a failure.
  it("reads nothing as no blocks", () => {
    expect(parseNoteDoc(null)).toEqual([]);
    expect(parseNoteDoc("")).toEqual([]);
  });

  // Rule 11 in miniature: a corrupt document costs a screen, not the app.
  it("reads rubbish as no blocks rather than throwing", () => {
    expect(parseNoteDoc("{not json")).toEqual([]);
    expect(parseNoteDoc('{"blocks":[]}')).toEqual([]);
  });
});

describe("reading a block", () => {
  it("flattens every run into one string", () => {
    const [, bullet] = parseNoteDoc(WEB_DOC);
    expect(blockText(bullet)).toBe("JR pass — book before we fly");
  });

  it("keeps a highlight's styles so it can be drawn", () => {
    const [, bullet] = parseNoteDoc(WEB_DOC);
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
    const blocks = parseNoteDoc(WEB_DOC);
    expect(isChecked(blocks[2])).toBe(true);
    expect(headingLevel(blocks[0])).toBe(2);
  });

  it("falls back to the smallest heading when the level is missing", () => {
    expect(headingLevel({ type: "heading" })).toBe(3);
  });
});

describe("writing a block", () => {
  // The rule the whole decision rests on — see `301-notes-on-a-phone`.
  it("keeps a block's id, type and props when its text changes", () => {
    const [heading] = parseNoteDoc(WEB_DOC);
    const edited = setBlockText(heading, "Trains");
    expect(edited.id).toBe("a");
    expect(edited.type).toBe("heading");
    expect(edited.props).toEqual({ level: 2, textColor: "default" });
    expect(blockText(edited)).toBe("Trains");
  });

  it("leaves a block the phone cannot draw completely alone", () => {
    const table: NoteBlock = { id: "t", type: "table", props: { rows: 3 }, content: [] };
    expect(isDrawn(table)).toBe(false);
    const document = parseNoteDoc(WEB_DOC).concat(table);
    // A round trip that edits one block must not touch the others at all.
    const after = parseNoteDoc(
      serialiseNoteDoc(document.map((b, i) => (i === 0 ? setBlockText(b, "Trains") : b))),
    );
    expect(after[3]).toEqual(table);
  });

  it("ticks a box without touching its text", () => {
    const [, , check] = parseNoteDoc(WEB_DOC);
    const off = setChecked(check, false);
    expect(isChecked(off)).toBe(false);
    expect(blockText(off)).toBe("Suica card");
  });

  it("makes a new checkbox unchecked, and a paragraph propless", () => {
    expect(isChecked(newBlock("checkListItem", "Pack socks"))).toBe(false);
    expect(newBlock("paragraph", "Hello").props).toEqual({});
  });

  it("ticks a block that had no props at all", () => {
    expect(isChecked(setChecked({ type: "checkListItem" }, true))).toBe(true);
    expect(isChecked({ type: "checkListItem" })).toBe(false);
  });
});
