import { describe, expect, it } from "vitest";

import { EMPTY_PAGE, bulletPage, clampIndent, inlineText, pageText, parsePageBody, serialisePage, type PageBlock } from "./page-blocks";

describe("parsePageBody", () => {
  it("reads back what was written", () => {
    const blocks: PageBlock[] = [
      { type: "heading", id: "h1", level: 2, indent: 0, content: [{ type: "text", text: "To book", marks: [{ type: "bold" }] }] },
      { type: "check", indent: 1, checked: true, content: [{ type: "tripLink", kind: "day", id: 4, label: "Sun 1 Nov" }] },
      { type: "divider" },
      { type: "table", header: true, rows: [[{ tone: "mint", content: [{ type: "text", text: "Place" }] }]] },
    ];
    expect(parsePageBody(serialisePage(blocks))).toEqual(blocks);
  });

  it("reads anything unreadable as one empty paragraph", () => {
    for (const raw of [null, "", "not json", "[]", '{"version":1}', '{"version":1,"blocks":[]}', '{"version":1,"blocks":[{"type":"video"}]}']) {
      expect(parsePageBody(raw)).toEqual(EMPTY_PAGE);
    }
  });

  it("drops what it cannot read and keeps the rest", () => {
    const raw = JSON.stringify({
      version: 1,
      blocks: [
        { type: "image", src: "x" },
        { type: "paragraph", indent: 9, content: [{ type: "text", text: "kept", marks: [{ type: "glitter" }, { type: "italic" }] }, { type: "sticker" }] },
        { type: "heading", level: 7, content: [] },
        { type: "numbered", indent: "two", content: "loose text" },
        { type: "table", rows: [[{ tone: "red", content: [] }], "row"] },
      ],
    });
    expect(parsePageBody(raw)).toEqual([
      { type: "paragraph", indent: 3, content: [{ type: "text", text: "kept", marks: [{ type: "italic" }] }] },
      { type: "heading", id: "", level: 3, indent: 0, content: [] },
      { type: "numbered", indent: 0, content: [] },
      { type: "table", header: false, rows: [[{ tone: null, content: [] }]] },
    ]);
  });

  it("skips entries that are not objects at every level", () => {
    const raw = { version: 1, blocks: ["x", { type: "table", rows: [] }, { type: "table", rows: [[7]] }, { type: "bullet", content: [5, { type: "text", text: "a", marks: ["bold"] }] }] };
    expect(parsePageBody(raw)).toEqual([{ type: "bullet", indent: 0, content: [{ type: "text", text: "a" }] }]);
  });

  it("keeps a link's address, a highlight's tone and a comment's thread", () => {
    const raw = JSON.stringify({
      version: 1,
      blocks: [{
        type: "quote",
        indent: 0,
        content: [{
          type: "text",
          text: "x",
          marks: [
            { type: "link", href: "https://a.b" },
            { type: "highlight", tone: "butter" },
            { type: "comment", id: 12 },
            { type: "link" },
            { type: "highlight", tone: "neon" },
            { type: "comment", id: "12" },
          ],
        }],
      }],
    });
    expect(parsePageBody(raw)).toEqual([{
      type: "quote",
      indent: 0,
      content: [{ type: "text", text: "x", marks: [{ type: "link", href: "https://a.b" }, { type: "highlight", tone: "butter" }, { type: "comment", id: 12 }] }],
    }]);
  });

  it("drops a trip link it cannot place", () => {
    const raw = JSON.stringify({
      version: 1,
      blocks: [{ type: "bullet", indent: 0, content: [
        { type: "tripLink", kind: "planet", id: 1, label: "x" },
        { type: "tripLink", kind: "event", id: -1, label: "x" },
        { type: "tripLink", kind: "event", id: 3 },
      ] }],
    });
    expect(parsePageBody(raw)).toEqual([{ type: "bullet", indent: 0, content: [{ type: "tripLink", kind: "event", id: 3, label: "" }] }]);
  });
});

describe("clampIndent", () => {
  it("keeps an indent between 0 and 3", () => {
    expect([-1, 0, 2, 3, 4, 1.5, Number.NaN].map(clampIndent)).toEqual([0, 0, 2, 3, 3, 1, 0]);
  });
});

describe("inlineText", () => {
  it("reads a line as its words, a trip link as its name", () => {
    expect(inlineText([{ type: "text", text: "Table for " }, { type: "tripLink", kind: "event", id: 1, label: "Dinner" }])).toBe("Table for Dinner");
    expect(inlineText([])).toBe("");
  });
});

describe("pageText", () => {
  it("reads every line and cell, and nothing for a divider", () => {
    expect(pageText([
      { type: "heading", id: "", level: 1, indent: 0, content: [{ type: "text", text: "Lisbon" }] },
      { type: "divider" },
      { type: "table", header: false, rows: [[{ tone: null, content: [{ type: "text", text: "a" }] }, { tone: null, content: [{ type: "text", text: "b" }] }]] },
    ])).toBe("Lisbon\n\na\tb");
  });
});

describe("bulletPage", () => {
  it("makes one bullet per line, or an empty page", () => {
    expect(bulletPage(["Tram 28"])).toEqual([{ type: "bullet", indent: 0, content: [{ type: "text", text: "Tram 28" }] }]);
    expect(bulletPage([])).toEqual(EMPTY_PAGE);
  });
});
