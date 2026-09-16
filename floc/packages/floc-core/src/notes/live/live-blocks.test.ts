import * as Y from "yjs";
import { describe, expect, it } from "vitest";

import { blockText, isChecked } from "../note-blocks";
import {
  insertLiveBlock,
  readLiveBlocks,
  removeLiveBlock,
  setLiveChecked,
  setLiveText,
  setLiveType,
} from "./live-blocks";
import { NOTES_FRAGMENT } from "./live-names";

function container(id: string, type: string, attrs: Record<string, unknown>, text: Y.XmlText) {
  const content = new Y.XmlElement(type);
  for (const [key, value] of Object.entries(attrs)) content.setAttribute(key, value as string);
  content.insert(0, [text]);
  const block = new Y.XmlElement("blockContainer");
  block.setAttribute("id", id);
  block.insert(0, [content]);
  return block;
}

function seeded() {
  const doc = new Y.Doc();
  const group = new Y.XmlElement("blockGroup");
  doc.getXmlFragment(NOTES_FRAGMENT).insert(0, [group]);
  const bold = new Y.XmlText();
  group.insert(0, [
    container("a", "paragraph", { textAlignment: "left" }, bold),
    container("t", "table", {}, new Y.XmlText()),
  ]);
  bold.insert(0, "hi ");
  bold.insert(3, "there", { bold: {} });
  return doc;
}

const texts = (doc: Y.Doc) => readLiveBlocks(doc).map(blockText);

describe("reading the live doc", () => {
  it("reads each top-level block with its id, type, props and styled runs", () => {
    const [first, table] = readLiveBlocks(seeded());
    expect(first).toMatchObject({ id: "a", type: "paragraph", props: { textAlignment: "left" } });
    expect(first.content).toEqual([
      { type: "text", text: "hi ", styles: {} },
      { type: "text", text: "there", styles: { bold: true } },
    ]);
    expect(table.type).toBe("table");
  });

  it("reads a link run with its href", () => {
    const doc = seeded();
    const text = new Y.XmlText();
    (doc.getXmlFragment(NOTES_FRAGMENT).get(0) as Y.XmlElement).push([container("l", "paragraph", {}, text)]);
    text.insert(0, "map", { link: { href: "https://x.test" } });
    expect(readLiveBlocks(doc)[2].content).toEqual([
      { type: "link", href: "https://x.test", content: [{ type: "text", text: "map", styles: {} }] },
    ]);
  });

  it("reads nested children, a coloured run, and a block with no text yet", () => {
    const doc = seeded();
    const group = doc.getXmlFragment(NOTES_FRAGMENT).get(0) as Y.XmlElement;
    const kid = new Y.XmlText();
    const nested = new Y.XmlElement("blockGroup");
    nested.insert(0, [container("k", "paragraph", {}, kid)]);
    const empty = new Y.XmlElement("paragraph");
    const bare = new Y.XmlElement("blockContainer");
    bare.setAttribute("id", "e");
    bare.insert(0, [empty]);
    group.push([bare]);
    (group.get(0) as Y.XmlElement).push([nested]);
    kid.insert(0, "red", { textColor: { stringValue: "red" } });

    const [first, , last] = readLiveBlocks(doc);
    expect(first.children?.[0].content).toEqual([{ type: "text", text: "red", styles: { textColor: "red" } }]);
    expect(last.content).toEqual([]);

    setLiveType(doc, "e", "bulletListItem");
    setLiveText(doc, "e", "now typed");
    expect(blockText(readLiveBlocks(doc)[2])).toBe("now typed");
  });

  it("reads an empty doc as no blocks", () => {
    expect(readLiveBlocks(new Y.Doc())).toEqual([]);
  });
});

describe("editing the live doc", () => {
  it("changes only the typed span, so styling elsewhere stays", () => {
    const doc = seeded();
    setLiveText(doc, "a", "oh hi there");
    expect(texts(doc)[0]).toBe("oh hi there");
    expect(readLiveBlocks(doc)[0].content).toContainEqual({ type: "text", text: "there", styles: { bold: true } });
  });

  it("merges two people typing in one line at once", () => {
    const one = seeded();
    const two = new Y.Doc();
    Y.applyUpdate(two, Y.encodeStateAsUpdate(one));
    setLiveText(one, "a", "oh hi there");
    setLiveText(two, "a", "hi there!");
    Y.applyUpdate(one, Y.encodeStateAsUpdate(two));
    Y.applyUpdate(two, Y.encodeStateAsUpdate(one));
    expect(texts(one)[0]).toBe("oh hi there!");
    expect(texts(two)[0]).toBe("oh hi there!");
  });

  it("inserts a new block after another, with the defaults its type needs", () => {
    const doc = seeded();
    insertLiveBlock(doc, "a", "n", "checkListItem");
    const blocks = readLiveBlocks(doc);
    expect(blocks.map((b) => b.id)).toEqual(["a", "n", "t"]);
    expect(blocks[1]).toMatchObject({ type: "checkListItem", props: { checked: false } });
  });

  it("ticks a box", () => {
    const doc = seeded();
    insertLiveBlock(doc, "a", "n", "checkListItem");
    setLiveChecked(doc, "n", true);
    expect(isChecked(readLiveBlocks(doc)[1])).toBe(true);
  });

  it("changes a block's type and keeps its id, text and colours", () => {
    const doc = seeded();
    setLiveType(doc, "a", "heading");
    const [first] = readLiveBlocks(doc);
    expect(first).toMatchObject({ id: "a", type: "heading", props: { level: 1, textAlignment: "left" } });
    expect(first.content).toContainEqual({ type: "text", text: "there", styles: { bold: true } });
  });

  it("removes a block, but never the last one", () => {
    const doc = seeded();
    expect(removeLiveBlock(doc, "a")).toBe(true);
    expect(readLiveBlocks(doc).map((b) => b.id)).toEqual(["t"]);
    expect(removeLiveBlock(doc, "t")).toBe(false);
  });

  it("ignores an id that is not there, or a block it cannot edit", () => {
    const doc = seeded();
    const before = Y.encodeStateAsUpdate(doc);
    setLiveText(doc, "gone", "x");
    setLiveText(doc, "t", "x");
    setLiveType(doc, "t", "paragraph");
    setLiveChecked(doc, "gone", true);
    insertLiveBlock(doc, "gone", "n", "paragraph");
    expect(removeLiveBlock(doc, "gone")).toBe(false);
    expect(readLiveBlocks(doc).map((b) => b.id)).toEqual(["a", "t"]);
    expect(Y.encodeStateAsUpdate(doc)).toEqual(before);
  });
});
