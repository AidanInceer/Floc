/**
 * The discussion panel an idea unfolds into — a full-width row under the board
 * row that holds the card, tethered back to it by a notch. Split out of
 * idea-card so the card stays a card and the board can place this row itself.
 */
"use client";

import { useEffect, useRef, useState } from "react";

import { IdeaByline, IdeaVoteBar } from "@/components/idea-byline";
import { NoteThread } from "@/components/note-thread";
import { linkify } from "@/components/linkify";
import type { IdeaCardData } from "@/components/idea-data";

export function IdeaDiscussion({
  tripId,
  idea,
  viewerId,
  isAdmin,
  onCollapse,
}: {
  tripId: number;
  idea: IdeaCardData;
  viewerId: string;
  isAdmin: boolean;
  onCollapse: () => void;
}) {
  const panelRef = useRef<HTMLLIElement>(null);
  // This row spans the whole board, so the notch only lands under the card that
  // opened it once we know that card's offset within the row.
  const [notchLeft, setNotchLeft] = useState(32);

  useEffect(() => {
    const panel = panelRef.current;
    const board = panel?.parentElement;
    if (!panel || !board) return;

    const measure = () => {
      const card = board.querySelector(`[data-idea-card="${idea.id}"]`);
      if (!card) return;
      const offset =
        card.getBoundingClientRect().left - panel.getBoundingClientRect().left;
      setNotchLeft(Math.max(20, offset + 32));
    };
    measure();

    // Watching the board covers both a viewport resize and the card moving out
    // from under the notch when pinning re-orders the row.
    const observer = new ResizeObserver(measure);
    observer.observe(board);
    return () => observer.disconnect();
  }, [idea.id]);

  // Focus moves into the panel so the keyboard doesn't have to cross the rest of
  // the row to reach what the chevron just opened. Mount only — re-running it
  // would yank focus out of the composer mid-sentence.
  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  // Escape closes it, as the <dialog> this replaced did for free. Through a ref
  // so a fresh onCollapse identity each render doesn't rebind the listener.
  const collapseRef = useRef(onCollapse);
  collapseRef.current = onCollapse;
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") collapseRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <li
      ref={panelRef}
      id={`idea-discussion-${idea.id}`}
      tabIndex={-1}
      aria-label={`Discussion — ${idea.note}`}
      className="relative col-span-full rounded-lg border border-rule-strong bg-sheet shadow-lifted"
    >
      <span
        style={{ left: notchLeft }}
        className="absolute -top-[7px] h-3.5 w-3.5 rotate-45 rounded-tl-[3px] border-l border-t border-rule-strong bg-sheet"
      />

      {/* Collapse rides its own row rather than floating over the panel — the
          thread's own sort toggle sits top-right and they collided. */}
      <div className="flex justify-end px-5 pt-4">
        <button
          type="button"
          onClick={onCollapse}
          className="inline-flex items-center gap-1.5 rounded-full border border-rule-strong bg-sheet px-3 py-1 font-mono text-[10.5px] tracking-[0.02em] text-ink-faint transition-colors hover:border-pen hover:text-pen"
        >
          Collapse
          <svg
            viewBox="0 0 24 24"
            width="12"
            height="12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
      </div>

      <div className="grid gap-6 px-5 pb-6 pt-2 sm:grid-cols-[minmax(14rem,17rem)_1fr]">
        <div className="sm:border-r sm:border-rule sm:pr-6">
          <p className="text-[15px] break-words">{linkify(idea.note)}</p>
          <div className="mt-3">
            <IdeaByline idea={idea} />
          </div>
          <div className="mt-4">
            <IdeaVoteBar tripId={tripId} idea={idea} viewerId={viewerId} />
          </div>
        </div>

        <div className="min-w-0">
          <NoteThread
            tripId={tripId}
            scope="idea"
            scopeId={idea.id}
            notes={idea.notes}
            viewerId={viewerId}
            isAdmin={isAdmin}
            placeholder="Why this one, or why not?"
          />
        </div>
      </div>
    </li>
  );
}
