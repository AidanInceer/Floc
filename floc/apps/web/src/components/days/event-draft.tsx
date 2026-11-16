"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

import { holdDraft, settleDraft, withDrafts, type EventDraft, type HeldDrafts } from "@/lib/days/event-drafts";

type DraftApi = {
  change: (eventId: number, draft: EventDraft) => number;
  settle: (eventId: number, rev: number) => void;
};

const DraftContext = createContext<DraftApi | null>(null);

export const EventDraftProvider = DraftContext.Provider;

export function useEventDrafts() {
  const [held, setHeld] = useState<HeldDrafts>(() => new Map());
  const rev = useRef(0);

  const change = useCallback((eventId: number, draft: EventDraft) => {
    const next = ++rev.current;
    setHeld((prev) => holdDraft(prev, eventId, draft, next));
    return next;
  }, []);

  const settle = useCallback((eventId: number, at: number) => {
    setHeld((prev) => settleDraft(prev, eventId, at));
  }, []);

  const api = useMemo(() => ({ change, settle }), [change, settle]);
  const apply = useCallback(<T extends { id: number }>(events: T[]) => withDrafts(events, held), [held]);
  return { api, apply };
}

export function useEventDraft(eventId: number | undefined) {
  const api = useContext(DraftContext);
  const last = useRef(0);

  const change = useCallback(
    (draft: EventDraft) => {
      if (api && eventId) last.current = api.change(eventId, draft);
    },
    [api, eventId],
  );

  const saving = useCallback(() => {
    const at = last.current;
    return () => {
      if (api && eventId) api.settle(eventId, at);
    };
  }, [api, eventId]);

  const drop = useCallback(() => {
    if (api && eventId && last.current) api.settle(eventId, last.current);
  }, [api, eventId]);

  return { change, saving, drop };
}
