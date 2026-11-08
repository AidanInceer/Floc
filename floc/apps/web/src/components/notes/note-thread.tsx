"use client";

// Discussion thread under a Days event (event comments D, 2026-11-07). Oldest first.
// Replies are exactly one level deep (v0.2 ticket 06): a reply to a reply attaches to the
// same parent, since a thread renders in a narrow panel. Replies start folded.
// Client component because fold and composer state is local per thread.
import { useOptimistic, useState } from "react";

import { emptyReactions, repliesLabel, threadCount, withPendingNote, type NoteRow } from "@floc/core/notes/notes";

import type { NoteScope } from "@/db/schema";
import { addNote } from "@/app/trip/[id]/notes-actions";
import { NoteComment } from "./note-comment";
import { NoteComposer, type Face } from "./note-composer";

export type { NoteRow };

export type Viewer = Face & { id: string };

type Where = { tripId: number; scope: NoteScope; scopeId: number };

type Post = (formData: FormData) => Promise<{ error?: string } | void>;

function Run({ where, note, viewer, reply: postReply }: { where: Where; note: NoteRow; viewer: Viewer; reply: Post }) {
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
              post={postReply}
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
  // Why: a posted comment shows at once; the saved one replaces it when the post lands, or it goes if refused.
  const [shown, addPending] = useOptimistic(notes, (runs, pending: { row: NoteRow; parentId: number | null }) =>
    withPendingNote(runs, pending.row, pending.parentId),
  );
  const posting = (replyTo: number | null): Post => async (formData) => {
    const body = String(formData.get("body") ?? "").trim();
    if (body) addPending({ row: pendingRow(body, viewer), parentId: replyTo });
    return addNote(tripId, scope, scopeId, replyTo, formData);
  };
  const count = threadCount(shown);

  return (
    <section aria-label="Comments">
      <h3 className="mb-2 flex items-baseline gap-2 text-sm font-medium text-ink">
        Comments
        {count ? <span className="font-mono text-xs font-normal text-ink-faint">{count}</span> : null}
      </h3>
      {shown.length ? (
        <ul className="space-y-3.5">
          {shown.map((n) => (
            <Run key={n.id} where={where} note={n} viewer={viewer} reply={posting(n.id)} />
          ))}
        </ul>
      ) : null}
      <div className={shown.length ? "mt-[18px] border-t border-rule pt-3.5" : undefined}>
        <NoteComposer
          me={viewer}
          label="Comment"
          post={posting(null)}
        />
      </div>
    </section>
  );
}

function pendingRow(body: string, viewer: Viewer): NoteRow {
  return {
    id: -Date.now(),
    body,
    createdAt: new Date(),
    editedAt: null,
    createdBy: viewer.id,
    authorName: viewer.name,
    authorAvatarIcon: viewer.icon,
    authorTone: viewer.tone,
    reactions: emptyReactions(),
    replies: [],
  };
}
