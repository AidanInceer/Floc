"use client";

import type { HocuspocusProvider } from "@hocuspocus/provider";
import { useEffect, useState } from "react";
import type * as Y from "yjs";

import {
  presentBlockCursors,
  presentPeople,
  type PresentBlockCursor,
  type PresentPerson,
} from "@floc/core/notes/live/live-presence";

export function useLivePresence(
  provider: HocuspocusProvider,
  doc: Y.Doc,
): { people: PresentPerson[]; cursors: PresentBlockCursor[] } {
  const [people, setPeople] = useState<PresentPerson[]>([]);
  const [cursors, setCursors] = useState<PresentBlockCursor[]>([]);
  useEffect(() => {
    const awareness = provider.awareness;
    if (!awareness) return;
    const update = () => {
      const states = awareness.getStates();
      setPeople(presentPeople(states));
      const phoneStates = new Map(
        [...states].filter(([, state]) => typeof (state as { blockCursor?: unknown } | null)?.blockCursor === "string"),
      );
      setCursors(presentBlockCursors(phoneStates, doc));
    };
    update();
    awareness.on("change", update);
    doc.on("update", update);
    return () => {
      awareness.off("change", update);
      doc.off("update", update);
    };
  }, [doc, provider]);
  return { people, cursors };
}
