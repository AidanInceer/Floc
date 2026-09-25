import type * as Y from "yjs";

// Why: a page doc seeded again from its body (its live state lost) is made of
// new Yjs items. A device's cache of the old doc merged into it would double every block.
const META = "meta";

export function stampEpoch(doc: Y.Doc, epoch: string): void {
  doc.getMap(META).set("epoch", epoch);
}

export function readEpoch(doc: Y.Doc): string | null {
  const epoch = doc.getMap(META).get("epoch");
  return typeof epoch === "string" ? epoch : null;
}

export const liveCacheName = (documentName: string, epoch: string) => `floc-notes:${documentName}:${epoch}`;
