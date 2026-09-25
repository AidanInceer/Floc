import * as Y from "yjs";

import { readEpoch } from "@floc/core/notes/live/live-epoch";
import { loadPageState } from "./page-live-store";

export async function loadPageEpoch(pageId: number): Promise<string | null> {
  const { state } = await loadPageState(pageId);
  if (!state) return null;
  const doc = new Y.Doc();
  Y.applyUpdate(doc, state);
  return readEpoch(doc);
}
