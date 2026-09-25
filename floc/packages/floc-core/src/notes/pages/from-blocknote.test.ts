import { describe, expect, it } from "vitest";

import { EMPTY_PAGE } from "./page-blocks";
import { blockNoteText, fromBlockNote } from "./from-blocknote";
import { pageText } from "./page-blocks";

const text = (value: string, styles: Record<string, unknown> = {}) => ({ type: "text", text: value, styles });

describe("fromBlockNote", () => {
  it("keeps every line's text, type and tick, and turns nesting into indent", () => {
    const body = JSON.stringify([
      { id: "a", type: "heading", props: { level: 2 }, content: [text("To book")], children: [] },
      {
        id: "b",
        type: "checkListItem",
        props: { checked: true },
        content: [text("Flights")],
        children: [
          { id: "c", type: "checkListItem", props: { checked: false }, content: [text("Near Alfama")], children: [
            { id: "d", type: "bulletListItem", content: [text("one")], children: [
              { id: "e", type: "numberedListItem", content: [text("two")], children: [
                { id: "f", type: "toggleListItem", content: [text("deepest")] },
              ] },
            ] },
          ] },
        ],
      },
      { type: "quote", content: [text("Everyone brings one thing")] },
      { type: "heading", props: { level: 5 }, content: [text("Small")] },
      { type: "divider" },
      { type: "pageBreak" },
      { type: "paragraph", content: [] },
    ]);
    expect(fromBlockNote(body)).toEqual([
      { type: "heading", id: "a", level: 2, indent: 0, content: [{ type: "text", text: "To book" }] },
      { type: "check", indent: 0, checked: true, content: [{ type: "text", text: "Flights" }] },
      { type: "check", indent: 1, checked: false, content: [{ type: "text", text: "Near Alfama" }] },
      { type: "bullet", indent: 2, content: [{ type: "text", text: "one" }] },
      { type: "numbered", indent: 3, content: [{ type: "text", text: "two" }] },
      { type: "bullet", indent: 3, content: [{ type: "text", text: "deepest" }] },
      { type: "quote", indent: 0, content: [{ type: "text", text: "Everyone brings one thing" }] },
      { type: "heading", id: "", level: 3, indent: 0, content: [{ type: "text", text: "Small" }] },
      { type: "divider" },
      { type: "divider" },
      { type: "paragraph", indent: 0, content: [] },
    ]);
  });

  it("keeps bold, italic, underline, strike, links and background colour as a highlight", () => {
    const body = JSON.stringify([{
      type: "paragraph",
      content: [
        text("a", { bold: true, italic: true, underline: true, strike: true }),
        text("b", { backgroundColor: "yellow", textColor: "red", code: true }),
        text("c", { backgroundColor: "pink" }),
        text("d", { backgroundColor: "green" }),
        text("e", { backgroundColor: "purple" }),
        text("f", { backgroundColor: "gray" }),
        { type: "link", href: "https://cp.pt", content: [text("trains", { bold: true })] },
        { type: "link", content: "loose" },
        { type: "mention", text: "kept as words" },
      ],
    }]);
    expect(fromBlockNote(body)).toEqual([{
      type: "paragraph",
      indent: 0,
      content: [
        { type: "text", text: "a", marks: [{ type: "bold" }, { type: "italic" }, { type: "underline" }, { type: "strike" }] },
        { type: "text", text: "b", marks: [{ type: "highlight", tone: "butter" }] },
        { type: "text", text: "c", marks: [{ type: "highlight", tone: "blush" }] },
        { type: "text", text: "d", marks: [{ type: "highlight", tone: "mint" }] },
        { type: "text", text: "e", marks: [{ type: "highlight", tone: "peri" }] },
        { type: "text", text: "f" },
        { type: "text", text: "trains", marks: [{ type: "bold" }, { type: "link", href: "https://cp.pt" }] },
        { type: "text", text: "loose" },
        { type: "text", text: "kept as words" },
      ],
    }]);
  });

  it("keeps a table's cells, colours and header, in both cell shapes", () => {
    const body = JSON.stringify([
      {
        type: "table",
        content: {
          type: "tableContent",
          headerRows: 1,
          rows: [
            { cells: [{ type: "tableCell", props: { backgroundColor: "green" }, content: [text("Place")] }, { type: "tableCell", content: [] }] },
            { cells: [[text("Tavern")], [text("Book", { bold: true })]] },
          ],
        },
      },
      { type: "table", content: { type: "tableContent", rows: [] } },
    ]);
    expect(fromBlockNote(body)).toEqual([{
      type: "table",
      header: true,
      rows: [
        [{ tone: "mint", content: [{ type: "text", text: "Place" }] }, { tone: null, content: [] }],
        [{ tone: null, content: [{ type: "text", text: "Tavern" }] }, { tone: null, content: [{ type: "text", text: "Book", marks: [{ type: "bold" }] }] }],
      ],
    }]);
  });

  it("keeps code as its text, and a file as a link to it", () => {
    const body = JSON.stringify([
      { type: "codeBlock", content: [text("line one\nline two")] },
      { type: "image", props: { url: "https://x/y.png", caption: "The view" } },
      { type: "file", props: { url: "https://x/z.pdf", name: "Booking" } },
      { type: "video", props: { url: "https://x/v.mp4" } },
      { type: "audio", props: {} },
      { type: "mystery", content: [text("still words")] },
      { type: "mystery" },
      "not a block",
    ]);
    expect(fromBlockNote(body)).toEqual([
      { type: "paragraph", indent: 0, content: [{ type: "text", text: "line one\nline two" }] },
      { type: "paragraph", indent: 0, content: [{ type: "text", text: "The view", marks: [{ type: "link", href: "https://x/y.png" }] }] },
      { type: "paragraph", indent: 0, content: [{ type: "text", text: "Booking", marks: [{ type: "link", href: "https://x/z.pdf" }] }] },
      { type: "paragraph", indent: 0, content: [{ type: "text", text: "https://x/v.mp4", marks: [{ type: "link", href: "https://x/v.mp4" }] }] },
      { type: "paragraph", indent: 0, content: [{ type: "text", text: "still words" }] },
    ]);
  });

  it("reads nothing usable as one empty paragraph", () => {
    for (const body of [null, "", "{", "{}", "[]"]) expect(fromBlockNote(body)).toEqual(EMPTY_PAGE);
  });
});

describe("blockNoteText", () => {
  it("finds every word, however deep, and every one survives the move", () => {
    const body = JSON.stringify([
      { type: "paragraph", content: [text("Kyoto"), { type: "link", href: "x", content: [text("trains")] }], children: [{ type: "bulletListItem", content: [text("deep")] }] },
      { type: "table", content: { type: "tableContent", rows: [{ cells: [[text("cell")]] }] } },
      { type: "paragraph", content: [text("  ")] },
    ]);
    expect(blockNoteText(body)).toEqual(["Kyoto", "trains", "deep", "cell"]);
    const moved = pageText(fromBlockNote(body));
    expect(blockNoteText(body).every((words) => moved.includes(words))).toBe(true);
  });

  it("finds nothing in something unreadable", () => {
    expect(blockNoteText("{")).toEqual([]);
  });
});
