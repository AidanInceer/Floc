import * as Y from "yjs";
import { describe, expect, it } from "vitest";

import { liveBlockCursor } from "./live-block-cursor";
import { NOTES_FRAGMENT } from "./live-names";
import { cursorTone, liveUser, presentBlockCursors, presentPeople } from "./live-presence";

const ada = liveUser({ id: "u-ada", name: "Ada Lovelace" });
const mo = liveUser({ id: "u-mo", name: "Mo Farah" });

describe("liveUser", () => {
  it("carries the person's trip-wide tone", () => {
    expect(ada.tone).toMatch(/^who-[1-8]$/);
    expect(liveUser({ id: "x", name: "Ada Lovelace" }).tone).toBe(ada.tone);
  });
});

describe("cursorTone", () => {
  it("uses a known tone", () => {
    expect(cursorTone(ada)).toBe(ada.tone);
  });

  it("refuses a class name another client made up", () => {
    expect(cursorTone({ ...ada, tone: "who-1 evil" })).toBe("who-8");
    expect(cursorTone({})).toBe("who-8");
  });
});

describe("presentPeople", () => {
  it("lists each connected person once, even with two tabs open", () => {
    const states = new Map<number, unknown>([
      [1, { user: ada }],
      [2, { user: mo }],
      [3, { user: ada }],
    ]);
    expect(presentPeople(states).map((p) => p.name)).toEqual(["Ada Lovelace", "Mo Farah"]);
  });

  it("skips a client that has not said who it is", () => {
    const states = new Map<number, unknown>([
      [1, {}],
      [2, { user: { id: "u-x", name: 42 } }],
      [3, { user: mo }],
    ]);
    expect(presentPeople(states).map((p) => p.name)).toEqual(["Mo Farah"]);
  });

  it("drops a person when their state goes", () => {
    const states = new Map<number, unknown>([[1, { user: ada }]]);
    states.delete(1);
    expect(presentPeople(states)).toEqual([]);
  });
});

describe("presentBlockCursors", () => {
  it("lists the block each connected person is editing once", () => {
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
    const cursor = liveBlockCursor(doc, "plan");
    const states = new Map<number, unknown>([
      [1, { user: ada, cursor }],
      [2, { user: ada, cursor }],
      [3, { user: mo, cursor: { head: "made up" } }],
    ]);

    expect(presentBlockCursors(states, doc)).toEqual([
      { id: ada.id, name: ada.name, tone: ada.tone, blockId: "plan" },
    ]);
  });

  it("accepts the phone's explicit focused block when no ProseMirror cursor can be drawn", () => {
    const doc = new Y.Doc();
    const group = new Y.XmlElement("blockGroup");
    const block = new Y.XmlElement("blockContainer");
    const paragraph = new Y.XmlElement("paragraph");
    doc.getXmlFragment(NOTES_FRAGMENT).insert(0, [group]);
    group.insert(0, [block]);
    block.setAttribute("id", "plan");
    block.insert(0, [paragraph]);

    expect(presentBlockCursors(new Map([[1, { user: ada, blockCursor: "plan" }]]), doc)).toEqual([
      { id: ada.id, name: ada.name, tone: ada.tone, blockId: "plan" },
    ]);
  });
});
