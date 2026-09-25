import * as Y from "yjs";
import { describe, expect, it } from "vitest";

import { EMPTY_PAGE, type PageBlock } from "./page-blocks";
import { PAGE_FRAGMENT, readPageYjs, seedPageYjs } from "./page-yjs";

const page: PageBlock[] = [
  { type: "heading", id: "h-1", level: 2, indent: 0, content: [{ type: "text", text: "To book" }] },
  {
    type: "check",
    indent: 1,
    checked: true,
    content: [
      { type: "text", text: "Flights", marks: [{ type: "bold" }, { type: "highlight", tone: "butter" }] },
      { type: "text", text: " for " },
      { type: "tripLink", kind: "day", id: 4, label: "Sun 1 Nov" },
      { type: "text", text: "\n" },
      { type: "text", text: "see ", marks: [{ type: "italic" }] },
      { type: "text", text: "the site", marks: [{ type: "link", href: "https://cp.pt" }, { type: "comment", id: 9 }] },
    ],
  },
  { type: "paragraph", indent: 0, content: [] },
  { type: "divider" },
  { type: "quote", indent: 0, content: [{ type: "text", text: "Everyone brings one thing", marks: [{ type: "underline" }, { type: "strike" }] }] },
  { type: "bullet", indent: 2, content: [{ type: "text", text: "a" }] },
  { type: "numbered", indent: 3, content: [{ type: "text", text: "b" }] },
  {
    type: "table",
    header: true,
    rows: [
      [{ tone: null, content: [{ type: "text", text: "Place" }] }, { tone: "mint", content: [] }],
      [{ tone: "peri", content: [{ type: "tripLink", kind: "expense", id: 2, label: "Flat" }] }, { tone: null, content: [{ type: "text", text: "Book" }] }],
    ],
  },
];

const seeded = (blocks: PageBlock[]) => {
  const doc = new Y.Doc();
  seedPageYjs(doc, blocks);
  return doc;
};

describe("a page in Yjs", () => {
  it("reads back every block, mark, link and line break it was seeded with", () => {
    expect(readPageYjs(seeded(page))).toEqual(page);
  });

  it("survives a trip through another client", () => {
    const other = new Y.Doc();
    Y.applyUpdate(other, Y.encodeStateAsUpdate(seeded(page)));
    expect(readPageYjs(other)).toEqual(page);
  });

  it("reads an empty doc as one empty paragraph", () => {
    expect(readPageYjs(new Y.Doc())).toEqual(EMPTY_PAGE);
  });

  it("never seeds a doc that already has content, so two openers cannot double it", () => {
    const doc = seeded(page);
    seedPageYjs(doc, EMPTY_PAGE);
    expect(readPageYjs(doc)).toEqual(page);
  });
});

describe("reading what the editor wrote", () => {
  it("reads attributes the editor leaves out as their defaults, and marks under a hashed name", () => {
    const doc = new Y.Doc();
    const fragment = doc.getXmlFragment(PAGE_FRAGMENT);
    const heading = new Y.XmlElement("heading");
    const check = new Y.XmlElement("check");
    const text = new Y.XmlText();
    const stray = new Y.XmlElement("video");
    const table = new Y.XmlElement("table");
    const row = new Y.XmlElement("tableRow");
    const cell = new Y.XmlElement("tableCell");
    const link = new Y.XmlElement("tripLink");
    fragment.insert(0, [heading, check, stray, table, new Y.XmlElement("table")]);
    check.insert(0, [text, new Y.XmlElement("hardBreak"), new Y.XmlElement("tripLink"), new Y.XmlElement("sticker"), link]);
    link.setAttribute("kind", "place");
    link.setAttribute("id", 5 as unknown as string);
    table.insert(0, [row, new Y.XmlElement("tableRow")]);
    row.insert(0, [cell]);
    heading.setAttribute("level", "2");
    check.setAttribute("indent", 7 as unknown as string);
    cell.setAttribute("tone", "neon");
    text.insert(0, "one ", { bold: {}, italic: true, link: {} });
    text.insert(4, "two", { "comment--x1": { id: 3 }, "highlight": { tone: "gold" }, "comment--x2": { id: "bad" }, "glitter": {} });
    expect(readPageYjs(doc)).toEqual([
      { type: "heading", id: "", level: 3, indent: 0, content: [] },
      {
        type: "check",
        indent: 3,
        checked: false,
        content: [
          { type: "text", text: "one ", marks: [{ type: "bold" }, { type: "italic" }] },
          { type: "text", text: "two", marks: [{ type: "comment", id: 3 }] },
          { type: "text", text: "\n" },
          { type: "tripLink", kind: "place", id: 5, label: "" },
        ],
      },
      { type: "table", header: false, rows: [[{ tone: null, content: [] }]] },
    ]);
  });

  it("merges neighbouring runs that carry the same marks", () => {
    const doc = new Y.Doc();
    const paragraph = new Y.XmlElement("paragraph");
    const text = new Y.XmlText();
    doc.getXmlFragment(PAGE_FRAGMENT).insert(0, [paragraph]);
    paragraph.insert(0, [text, new Y.XmlElement("hardBreak"), new Y.XmlText()]);
    text.insert(0, "a");
    (paragraph.get(2) as Y.XmlText).insert(0, "b");
    expect(readPageYjs(doc)).toEqual([{ type: "paragraph", indent: 0, content: [{ type: "text", text: "a\nb" }] }]);
  });
});
