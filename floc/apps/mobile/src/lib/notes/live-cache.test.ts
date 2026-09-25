import { beforeEach, describe, expect, it, vi } from "vitest";

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
  }
  return { Directory, File, Paths: { document: "doc" } };
});

const { forgetCachedNotes, readCachedNotes, writeCachedNotes } = await import("./live-cache");

beforeEach(() => disk.clear());

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
