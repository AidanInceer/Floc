/**
 * Joins the app's live page to the editor's copy in the web view (#408). When
 * the web view says it is ready it is answered with the whole page and everyone
 * else on it; after that, only what changes. Its own typing and caret come back here
 * and go out on the socket as this person.
 */
import { useCallback, useEffect, useMemo, useRef, type RefObject } from "react";

import type { PageHandle } from "@/components/notes/page-dom";
import { FROM_PAGE, othersUpdate, sendChanges, takeChange, wholeDoc } from "@/lib/notes/relay";
import type { LivePage } from "./use-live-notes";

export function usePageRelay(page: LivePage | null, view: RefObject<PageHandle | null>) {
  const ready = useRef(false);
  // Why the doc and provider, not `page`: the page object is new each render, and a new one would reset `ready`.
  const doc = page?.doc;
  const provider = page?.provider;
  const live = useMemo(() => (doc && provider ? { doc, provider } : null), [doc, provider]);

  useEffect(() => {
    ready.current = false;
    if (!live) return;
    const stop = sendChanges(live.doc, FROM_PAGE, (update) => {
      if (ready.current) view.current?.change(update);
    });
    const awareness = live.provider.awareness;
    const moved = ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }) => {
      const update = awareness ? othersUpdate(awareness, [...added, ...updated, ...removed]) : null;
      if (ready.current && update) view.current?.others(update);
    };
    awareness?.on("change", moved);
    return () => {
      stop();
      awareness?.off("change", moved);
    };
  }, [live, view]);

  // Why an answer and not a push: the web view's handle may not be registered yet when it says it is ready.
  const onReady = useCallback(async (): Promise<{ page: string; others: string | null } | null> => {
    if (!live) return null;
    ready.current = true;
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
