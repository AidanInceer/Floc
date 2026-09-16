import type { HocuspocusProvider } from "@hocuspocus/provider";
import {
  liveUser,
  presentBlockCursors,
  presentPeople,
  type PresentBlockCursor,
  type PresentPerson,
} from "@floc/core/notes/live/live-presence";
import { useEffect, useState } from "react";
import type * as Y from "yjs";

type Viewer = { id: string; name: string };

export function useLivePresence(
  provider: HocuspocusProvider | null,
  doc: Y.Doc | null,
  viewer: Viewer | null,
  focusedBlockId: string | null,
): { people: PresentPerson[]; cursors: PresentBlockCursor[] } {
  const [people, setPeople] = useState<PresentPerson[]>([]);
  const [cursors, setCursors] = useState<PresentBlockCursor[]>([]);

  useEffect(() => {
    const awareness = provider?.awareness;
    if (!awareness || !doc || !viewer) return;
    awareness.setLocalStateField("user", liveUser(viewer));
    const update = () => {
      const states = awareness.getStates();
      setPeople(presentPeople(states));
      setCursors(presentBlockCursors(states, doc).filter((cursor) => cursor.id !== viewer.id));
    };
    update();
    awareness.on("change", update);
    doc.on("update", update);
    return () => {
      awareness.off("change", update);
      doc.off("update", update);
    };
  }, [doc, provider, viewer?.id, viewer?.name]);

  useEffect(() => {
    const awareness = provider?.awareness;
    if (!awareness || !doc) return;
    const publish = () => {
      awareness.setLocalState({ ...(awareness.getLocalState() ?? {}), cursor: null, blockCursor: focusedBlockId });
    };
    publish();
    doc.on("update", publish);
    return () => doc.off("update", publish);
  }, [doc, focusedBlockId, provider]);

  return { people, cursors };
}
