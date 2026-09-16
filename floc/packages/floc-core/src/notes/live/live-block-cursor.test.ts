import * as Y from "yjs";
import { describe, expect, it } from "vitest";

import { liveBlockCursor, liveCursorBlockId } from "./live-block-cursor";
import { NOTES_FRAGMENT } from "./live-names";

function seeded() {
  const doc = new Y.Doc();
  const group = new Y.XmlElement("blockGroup");
  const block = new Y.XmlElement("blockContainer");
  const paragraph = new Y.XmlElement("paragraph");
  const text = new Y.XmlText();
  doc.getXmlFragment(NOTES_FRAGMENT).insert(0, [group]);
  group.insert(0, [block]);
  block.setAttribute("id", "plan");
  block.insert(0, [paragraph]);
  paragraph.insert(0, [text]);
  text.insert(0, "Book trains");
  return doc;
}

describe("live block cursors", () => {
  it("resolves a phone cursor to the same block in another synced client", () => {
    const phone = seeded();
    const web = new Y.Doc();
    Y.applyUpdate(web, Y.encodeStateAsUpdate(phone));

    const cursor = liveBlockCursor(phone, "plan");

    expect(liveCursorBlockId(web, cursor)).toBe("plan");
  });

  it("returns no cursor for a block that is not in the document", () => {
    expect(liveBlockCursor(seeded(), "missing")).toBeNull();
  });

  it("ignores malformed and detached cursor positions from another client", () => {
    const doc = seeded();
    const detached = new Y.Doc();
    const position = Y.createRelativePositionFromTypeIndex(detached.getText("elsewhere"), 0);

    expect(liveCursorBlockId(doc, null)).toBeNull();
    expect(liveCursorBlockId(doc, { head: "made up" })).toBeNull();
    expect(liveCursorBlockId(doc, { head: position })).toBeNull();
  });

  it("ignores a valid position outside any block", () => {
    const doc = seeded();
    const cursor = {
      head: Y.createRelativePositionFromTypeIndex(doc.getXmlFragment(NOTES_FRAGMENT), 0),
    };

    expect(liveCursorBlockId(doc, cursor)).toBeNull();
  });
});
