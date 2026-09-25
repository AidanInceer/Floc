/**
 * The editor and the server read one page the same way (#408): what core seeds
 * into Yjs, the editor opens; what the editor writes, core reads back.
 */
import * as Y from "yjs";
import { prosemirrorJSONToYXmlFragment, yXmlFragmentToProseMirrorRootNode } from "@tiptap/y-tiptap";
import { describe, expect, it } from "vitest";

import type { PageBlock } from "@floc/core/notes/pages/page-blocks";
import { PAGE_FRAGMENT, readPageYjs, seedPageYjs } from "@floc/core/notes/pages/page-yjs";
import { pageSchema } from "./page-schema";

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
      { type: "text", text: "the site", marks: [{ type: "link", href: "https://cp.pt" }, { type: "comment", id: 9 }] },
    ],
  },
  { type: "paragraph", indent: 0, content: [] },
  { type: "divider" },
  { type: "quote", indent: 0, content: [{ type: "text", text: "Everyone", marks: [{ type: "italic" }, { type: "underline" }, { type: "strike" }] }] },
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

describe("one page, two readers", () => {
  const schema = pageSchema();

  it("opens in the editor exactly as the server seeded it", () => {
    const doc = new Y.Doc();
    seedPageYjs(doc, page);
    const node = yXmlFragmentToProseMirrorRootNode(doc.getXmlFragment(PAGE_FRAGMENT), schema);
    node.check();
    expect(node.childCount).toBe(page.length);
    expect(node.child(1).attrs).toMatchObject({ indent: 1, checked: true });
    expect(node.child(7).child(1).child(0).attrs).toMatchObject({ tone: "peri" });
  });

  it("reads back on the server what the editor wrote, overlapping comments included", () => {
    const seeded = new Y.Doc();
    seedPageYjs(seeded, page);
    const json = yXmlFragmentToProseMirrorRootNode(seeded.getXmlFragment(PAGE_FRAGMENT), schema).toJSON();
    const written = new Y.Doc();
    prosemirrorJSONToYXmlFragment(schema, json, written.getXmlFragment(PAGE_FRAGMENT));
    expect(readPageYjs(written)).toEqual(page);
  });

  it("keeps two comments on the same words", () => {
    const doc = schema.node("doc", null, [
      schema.node("paragraph", null, [schema.text("hire a car", [schema.mark("comment", { id: 1 }), schema.mark("comment", { id: 2 })])]),
    ]);
    const written = new Y.Doc();
    prosemirrorJSONToYXmlFragment(schema, doc.toJSON(), written.getXmlFragment(PAGE_FRAGMENT));
    expect(readPageYjs(written)).toEqual([
      { type: "paragraph", indent: 0, content: [{ type: "text", text: "hire a car", marks: [{ type: "comment", id: 1 }, { type: "comment", id: 2 }] }] },
    ]);
  });
});
