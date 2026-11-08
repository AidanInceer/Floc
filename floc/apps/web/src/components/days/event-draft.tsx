"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

import { holdDraft, settleDraft, withDrafts, type EventDraft, type HeldDrafts } from "@/lib/days/event-drafts";

type DraftApi = {
  change: (eventId: number, draft: EventDraft) => number;
  settle: (eventId: number, rev: number) => void;
};

const DraftContext = createContext<DraftApi | null>(null);

export const EventDraftProvider = DraftContext.Provider;

/**
 * Why: the event form autosaves 700 ms after a change, and the block under it only redrew when that
 * save's refresh came back. The calendar draws the form's change at once and drops it when the save
 * carrying it lands, so the server's row is the truth again (rule 7).
 */
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

/** The open event's link to the calendar: a no-op outside Days, and for an event not made yet. */
export function useEventDraft(eventId: number | undefined) {
  const api = useContext(DraftContext);
  const last = useRef(0);

  const change = useCallback(
    (draft: EventDraft) => {
      if (api && eventId) last.current = api.change(eventId, draft);
    },
    [api, eventId],
  );

  /** Call as a save goes; call what it returns once the save has landed. */
  const saving = useCallback(() => {
    const at = last.current;
    return () => {
      if (api && eventId) api.settle(eventId, at);
    };
  }, [api, eventId]);

  /** The form closed with a change its timer never sent, so the block goes back to the server's row. */
  const drop = useCallback(() => {
    if (api && eventId && last.current) api.settle(eventId, last.current);
  }, [api, eventId]);

  return { change, saving, drop };
}
