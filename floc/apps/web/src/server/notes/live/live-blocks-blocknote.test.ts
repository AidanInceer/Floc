/**
 * The phone's block edits (#394), read back by BlockNote itself: proof the
 * web editor sees what the phone wrote, and keeps what the phone cannot draw.
 */
import * as Y from "yjs";
import { describe, expect, it } from "vitest";

import {
  insertLiveBlock,
  readLiveBlocks,
  removeLiveBlock,
  setLiveChecked,
  setLiveText,
  setLiveType,
} from "@floc/core/notes/live/live-blocks";
import { blocksJson, seedFromJson } from "./live-doc";

const seeded = () => {
  const doc = new Y.Doc();
  seedFromJson(
    doc,
    JSON.stringify([
      { id: "p", type: "paragraph", content: [{ type: "text", text: "Kyoto", styles: { bold: true } }] },
      { id: "t", type: "table", content: { type: "tableContent", rows: [{ cells: [["a"]] }] } },
      { id: "e", type: "paragraph" },
    ]),
  );
  return doc;
};

const blocks = (doc: Y.Doc) => JSON.parse(blocksJson(doc)) as { id: string; type: string; props: Record<string, unknown>; content: unknown }[];

describe("phone edits read by BlockNote", () => {
  it("reads what BlockNote wrote, including an empty paragraph", () => {
    expect(readLiveBlocks(seeded()).map((b) => [b.id, b.type])).toEqual([["p", "paragraph"], ["t", "table"], ["e", "paragraph"]]);
  });

  it("sees text, a new checked item, a type change and a removal, and keeps the table", () => {
    const doc = seeded();
    const table = JSON.stringify(blocks(doc)[1]);

    setLiveText(doc, "p", "Kyoto in April");
    setLiveText(doc, "e", "typed into nothing");
    insertLiveBlock(doc, "p", "c", "checkListItem");
    setLiveText(doc, "c", "Book the ryokan");
    setLiveChecked(doc, "c", true);
    setLiveType(doc, "p", "heading");
    removeLiveBlock(doc, "e");

    const read = blocks(doc);
    expect(read.map((b) => [b.id, b.type])).toEqual([["p", "heading"], ["c", "checkListItem"], ["t", "table"]]);
    expect(read[0].props).toMatchObject({ level: 1 });
    expect(read[0].content).toEqual([{ type: "text", text: "Kyoto in April", styles: { bold: true } }]);
    expect(read[1]).toMatchObject({ props: { checked: true }, content: [{ type: "text", text: "Book the ryokan", styles: {} }] });
    expect(JSON.stringify(read[2])).toBe(table);
  });
});
