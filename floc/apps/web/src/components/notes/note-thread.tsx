"use client";

// Discussion thread under a Days event (event comments D, 2026-11-07). Oldest first.
// Replies are exactly one level deep (v0.2 ticket 06): a reply to a reply attaches to the
// same parent, since a thread renders in a narrow panel. Replies start folded.
// Client component because fold and composer state is local per thread.
import { useState } from "react";

import { repliesLabel, threadCount, type NoteRow } from "@floc/core/notes/notes";

import type { NoteScope } from "@/db/schema";
import { addNote } from "@/app/trip/[id]/notes-actions";
import { NoteComment } from "./note-comment";
import { NoteComposer, type Face } from "./note-composer";

export type { NoteRow };

export type Viewer = Face & { id: string };

type Where = { tripId: number; scope: NoteScope; scopeId: number };

function Run({ where, note, viewer }: { where: Where; note: NoteRow; viewer: Viewer }) {
  const [replying, setReplying] = useState(false);
  const [open, setOpen] = useState(false);
  const count = note.replies.length;
  const reply = () => {
    setReplying(true);
    setOpen(true);
  };

  return (
    <li>
      <NoteComment
        tripId={where.tripId}
        note={note}
        viewerId={viewer.id}
        onReply={reply}
        hasReplies={count > 0}
      />
      <div className="ml-[41px]">
        {count > 0 ? (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className="mt-1.5 inline-flex items-center gap-2 text-xs font-medium text-ink-soft transition-colors hover:text-pen max-sm:h-9"
          >
            <span aria-hidden="true" className="w-[22px] border-t border-rule-strong" />
            {repliesLabel(count, open)}
          </button>
        ) : null}
        {open
          ? note.replies.map((r) => (
              <NoteComment
                key={r.id}
                tripId={where.tripId}
                note={r}
                viewerId={viewer.id}
                onReply={reply}
                hasReplies={false}
                reply
              />
            ))
          : null}
        {replying ? (
          <div className="mt-2.5">
            <NoteComposer
              me={viewer}
              label={`Reply to ${note.authorName}`}
              post={addNote.bind(null, where.tripId, where.scope, where.scopeId, note.id)}
              reply
              onDone={() => setReplying(false)}
            />
          </div>
        ) : null}
      </div>
    </li>
  );
}

export function NoteThread({
  tripId,
  scope,
  scopeId,
  notes,
  viewer,
}: {
  tripId: number;
  scope: NoteScope;
  scopeId: number;
  notes: NoteRow[];
  viewer: Viewer;
}) {
  const where = { tripId, scope, scopeId };
  const count = threadCount(notes);

  return (
    <section aria-label="Comments">
      <h3 className="mb-3 flex items-baseline gap-2 text-sm font-medium">
        Comments
        {count ? <span className="font-mono text-xs font-normal text-ink-faint">{count}</span> : null}
      </h3>
      {notes.length ? (
        <ul className="space-y-3.5">
          {notes.map((n) => (
            <Run key={n.id} where={where} note={n} viewer={viewer} />
          ))}
        </ul>
      ) : null}
      <div className={notes.length ? "mt-[18px] border-t border-rule pt-3.5" : undefined}>
        <NoteComposer
          me={viewer}
          label="Comment"
          post={addNote.bind(null, tripId, scope, scopeId, null)}
        />
      </div>
    </section>
  );
}
