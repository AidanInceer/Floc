import * as Y from "yjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const disk = new Map<string, Uint8Array>();

vi.mock("expo-file-system", () => {
  class Directory {
    uri: string;
    constructor(...parts: string[]) {
      this.uri = parts.join("/");
    }
    get exists() {
      return [...disk.keys()].some((key) => key.startsWith(`${this.uri}/`));
    }
    create() {}
    delete() {
      for (const key of [...disk.keys()]) if (key.startsWith(`${this.uri}/`)) disk.delete(key);
    }
  }
  class File {
    uri: string;
    constructor(folder: Directory, name: string) {
      this.uri = `${folder.uri}/${name}`;
    }
    get exists() {
      return disk.has(this.uri);
    }
    bytesSync() {
      const bytes = disk.get(this.uri);
      if (bytes?.[0] === 255) throw new Error("corrupt");
      return bytes!;
    }
    write(bytes: Uint8Array) {
      disk.set(this.uri, bytes);
    }
    delete() {
      disk.delete(this.uri);
    }
  }
  return { Directory, File, Paths: { document: "doc" } };
});

const { fileCache, forgetCachedNotes, readCachedNotes, writeCachedNotes } = await import("./live-cache");

beforeEach(() => disk.clear());
afterEach(() => vi.useRealTimers());

describe("the notes pages kept on the phone", () => {
  it("reads back what was written, per page", () => {
    writeCachedNotes("trip-page:1:4", new Uint8Array([1, 2]));
    expect(readCachedNotes("trip-page:1:4")).toEqual(new Uint8Array([1, 2]));
    expect(readCachedNotes("trip-page:1:5")).toBeNull();
    expect([...disk.keys()]).toEqual(["doc/notes/trip-page_1_4.yjs"]);
  });

  it("reads an unreadable copy as none", () => {
    writeCachedNotes("trip-page:1:4", new Uint8Array([255]));
    expect(readCachedNotes("trip-page:1:4")).toBeNull();
  });

  it("forgets every page's copy", () => {
    writeCachedNotes("trip-page:1:4", new Uint8Array([1]));
    forgetCachedNotes();
    expect(readCachedNotes("trip-page:1:4")).toBeNull();
    expect(() => forgetCachedNotes()).not.toThrow();
  });
});

describe("the phone's page cache", () => {
  const key = "trip-page:1:4";

  it("starts a doc from what was kept under the key", () => {
    const kept = new Y.Doc();
    kept.getText("t").insert(0, "offline edit");
    writeCachedNotes(key, Y.encodeStateAsUpdate(kept));
    const doc = new Y.Doc();
    fileCache.open(key, doc);
    expect(doc.getText("t").toString()).toBe("offline edit");
  });

  it("saves a change shortly after it happens", () => {
    vi.useFakeTimers();
    const doc = new Y.Doc();
    fileCache.open(key, doc);
    doc.getText("t").insert(0, "typed");
    expect(readCachedNotes(key)).toBeNull();
    vi.advanceTimersByTime(600);
    const back = new Y.Doc();
    Y.applyUpdate(back, readCachedNotes(key)!);
    expect(back.getText("t").toString()).toBe("typed");
  });

  it("saves the latest state when closed before the delay passes", () => {
    vi.useFakeTimers();
    const doc = new Y.Doc();
    const handle = fileCache.open(key, doc);
    doc.getText("t").insert(0, "last words");
    handle.destroy();
    expect(readCachedNotes(key)).not.toBeNull();
    vi.advanceTimersByTime(600);
  });
});
