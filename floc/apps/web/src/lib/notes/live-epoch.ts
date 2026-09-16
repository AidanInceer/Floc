import type * as Y from "yjs";

// Why: a whole-doc save from the phone reseeds the live doc with new Yjs items.
// A browser cache of the old doc merged into it would duplicate every block.
const META = "meta";

export function stampEpoch(doc: Y.Doc, epoch: string): void {
  doc.getMap(META).set("epoch", epoch);
}

export function readEpoch(doc: Y.Doc): string | null {
  const epoch = doc.getMap(META).get("epoch");
  return typeof epoch === "string" ? epoch : null;
}

export const liveCacheName = (tripId: number, epoch: string) => `floc-notes:${tripId}:${epoch}`;
