import * as Y from "yjs";

import { readEpoch } from "@/lib/notes/live-epoch";
import { loadLiveState } from "./live-store";

export async function loadLiveEpoch(tripId: number): Promise<string | null> {
  const { state } = await loadLiveState(tripId);
  if (!state) return null;
  const doc = new Y.Doc();
  Y.applyUpdate(doc, state);
  return readEpoch(doc);
}
