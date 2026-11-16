import { useCallback, useEffect, useMemo, useRef, type RefObject } from "react";

import type { PageHandle } from "@/components/notes/page-dom";
import { FROM_PAGE, othersUpdate, sendChanges, takeChange, wholeDoc } from "@/lib/notes/relay";
import type { LivePage } from "./use-live-notes";

export function usePageRelay(page: LivePage | null, view: RefObject<PageHandle | null>, active: boolean) {
  const ready = useRef(false);
  const open = useRef(active);
  open.current = active;
  if (!active) ready.current = false;
  const loaded = useRef(false);
  const doc = page?.doc;
  const provider = page?.provider;
  const live = useMemo(() => (doc && provider ? { doc, provider } : null), [doc, provider]);

  useEffect(() => {
    ready.current = false;
    loaded.current = false;
    if (!live) return;
    const stop = sendChanges(live.doc, FROM_PAGE, (update) => {
      if (ready.current && open.current) view.current?.change(update);
    });
    const awareness = live.provider.awareness;
    const moved = ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }) => {
      const update = awareness ? othersUpdate(awareness, [...added, ...updated, ...removed]) : null;
      if (ready.current && open.current && update) view.current?.others(update);
    };
    awareness?.on("change", moved);
    return () => {
      stop();
      awareness?.off("change", moved);
    };
  }, [live, view]);

  useEffect(() => {
    if (!active || !live || !loaded.current || ready.current) return;
    ready.current = true;
    view.current?.change(wholeDoc(live.doc));
    const awareness = live.provider.awareness;
    const update = awareness ? othersUpdate(awareness, [...awareness.getStates().keys()]) : null;
    if (update) view.current?.others(update);
  }, [active, live, view]);

  const onReady = useCallback(async (): Promise<{ page: string; others: string | null } | null> => {
    if (!live) return null;
    ready.current = true;
    loaded.current = true;
    const awareness = live.provider.awareness;
    return { page: wholeDoc(live.doc), others: awareness ? othersUpdate(awareness, [...awareness.getStates().keys()]) : null };
  }, [live]);

  const onChange = useCallback(async (update: string) => {
    if (live) takeChange(live.doc, update, FROM_PAGE);
  }, [live]);

  const onPresence = useCallback(async (state: string) => {
    live?.provider.awareness?.setLocalState(JSON.parse(state) as Record<string, unknown> | null);
  }, [live]);

  return { onReady, onChange, onPresence };
}
