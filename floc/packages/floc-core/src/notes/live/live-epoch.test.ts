import * as Y from "yjs";
import { describe, expect, it } from "vitest";

import { liveCacheName, readEpoch, stampEpoch } from "./live-epoch";

describe("the live Notes epoch", () => {
  it("reads back what was stamped", () => {
    const doc = new Y.Doc();
    stampEpoch(doc, "e1");
    expect(readEpoch(doc)).toBe("e1");
  });

  it("is null on a doc never stamped", () => {
    expect(readEpoch(new Y.Doc())).toBeNull();
  });

  it("keys the local cache by trip and epoch, so a reseeded doc never merges with an old copy", () => {
    expect(liveCacheName(7, "e1")).not.toBe(liveCacheName(7, "e2"));
    expect(liveCacheName(7, "e1")).not.toBe(liveCacheName(8, "e1"));
  });
});
