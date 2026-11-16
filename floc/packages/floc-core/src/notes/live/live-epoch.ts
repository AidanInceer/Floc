import type * as Y from "yjs";

const META = "meta";

export function stampEpoch(doc: Y.Doc, epoch: string): void {
  doc.getMap(META).set("epoch", epoch);
}

export function readEpoch(doc: Y.Doc): string | null {
  const epoch = doc.getMap(META).get("epoch");
  return typeof epoch === "string" ? epoch : null;
}

export const LIVE_CACHE_PREFIX = "floc-notes:";

export const liveCacheName = (documentName: string, epoch: string) => `${LIVE_CACHE_PREFIX}${documentName}:${epoch}`;
