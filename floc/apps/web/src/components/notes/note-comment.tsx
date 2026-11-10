"use client";

import { useOptimistic, useState } from "react";

import { commentTime, likes, toggleLike, type NoteRow } from "@floc/core/notes/notes";

import { Avatar, cx, menuDangerItemClass, menuItemClass, panelFieldClass } from "@/components/system/ui";
import { ReactionGlyph } from "@/components/system/icons/reaction";
import { ActionForm, ConfirmSubmit, Menu, SubmitButton } from "@/components/system/client-ui";
import { deleteNote, editNote, react } from "@/app/trip/[id]/notes-actions";

const metaFigure = "font-mono text-[10.5px] tracking-[0.02em] text-ink-faint";

/** One heart, inline after Reply (event comments D): yours fills in pen, the count says how many. */
function HeartButton({ tripId, note }: { tripId: number; note: NoteRow }) {
  // Why: the heart answers under the finger; the server's count replaces it when the toggle lands.
  const [{ count, mine }, flip] = useOptimistic(likes(note), (shown) => toggleLike(shown));
  return (
    <form
      action={async () => {
        flip(undefined);
        await react(tripId, note.id, "heart");
      }}
    >
      <button
        type="submit"
        aria-pressed={mine}
        aria-label={`Like, ${count}`}
        title="Like"
        className={cx(
          "ml-1 inline-flex h-[26px] items-center gap-[5px] rounded-sm px-2 text-xs transition-colors hover:bg-pen-soft hover:text-pen-deep max-sm:h-9 max-sm:px-2.5",
          mine ? "text-pen" : "text-ink-soft",
        )}
      >
        <ReactionGlyph kind="heart" mine={mine} />
        {count ? <span className="font-mono">{count}</span> : null}
      </button>
    </form>
  );
}

function EditForm({ tripId, note, onDone }: { tripId: number; note: NoteRow; onDone: () => void }) {
  return (
    <ActionForm
      action={async (formData) => {
        const result = await editNote(tripId, note.id, formData);
        if (!result?.error) onDone();
        return result;
      }}
      className="mt-1"
      keepAnswers
    >
      <textarea
        name="body"
        rows={2}
        maxLength={2000}
        defaultValue={note.body}
        aria-label="Edit comment"
        autoFocus
        className={cx(panelFieldClass, "resize-y max-sm:py-[11px]")}
      />
      <div className="mt-2 flex items-center justify-end gap-3">
        <button type="button" onClick={onDone} className="px-0.5 py-1 text-xs font-medium text-ink-soft transition-colors hover:text-pen max-sm:h-9">
          Cancel
        </button>
        <SubmitButton variant="primary">
          Save
        </SubmitButton>
      </div>
    </ActionForm>
  );
}

/** Edit and Delete, behind the dots: one visible action per row. Only on your own comment. */
function OwnMenu({
  tripId,
  note,
  hasReplies,
  onEdit,
}: {
  tripId: number;
  note: NoteRow;
  hasReplies: boolean;
  onEdit: () => void;
}) {
  return (
    <Menu
      label="More for your comment"
      align="left"
      triggerClassName="inline-grid size-[26px] place-items-center rounded-sm text-ink-soft hover:bg-pen-soft hover:text-pen-deep data-[open=true]:bg-pen-soft data-[open=true]:text-pen-deep max-sm:size-9"
    >
      <button type="button" role="menuitem" onClick={onEdit} className={menuItemClass}>
        Edit
      </button>
      <form action={deleteNote.bind(null, tripId, note.id)}>
        <ConfirmSubmit
          message={hasReplies ? "Delete this comment? The replies to it go too." : "Delete this comment?"}
          confirmLabel="Delete it"
          variant="ghost"
          confirmVariant="danger"
          className={menuDangerItemClass}
        >
          Delete
        </ConfirmSubmit>
      </form>
    </Menu>
  );
}

export function NoteComment({
  tripId,
  note,
  viewerId,
  onReply,
  hasReplies,
  reply,
}: {
  tripId: number;
  note: NoteRow;
  viewerId: string;
  onReply: () => void;
  /** Deleting a comment takes its replies with it, so the question says so. */
  hasReplies: boolean;
  reply?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const mine = note.createdBy === viewerId;

  return (
    <article className={cx("flex items-start gap-[11px]", reply && "mt-2.5")}>
      <Avatar name={note.authorName} tone={note.authorTone} size={reply ? 24 : 30} />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm leading-[1.3]">
          <b className="font-semibold">{note.authorName}</b>
          {/* suppressHydrationWarning: the label comes from the clock, and server and client can land a minute apart. */}
          <span suppressHydrationWarning className={metaFigure}>
            {commentTime(note.createdAt)}
          </span>
          {note.editedAt ? <span className={metaFigure}>edited</span> : null}
        </p>

        {editing ? (
          <EditForm tripId={tripId} note={note} onDone={() => setEditing(false)} />
        ) : (
          <p className="mt-0.5 text-sm leading-normal whitespace-pre-wrap [overflow-wrap:anywhere]">{note.body}</p>
        )}

        {editing ? null : (
          <div className="mt-0.5 -ml-0.5 flex items-center gap-0.5">
            <button
              type="button"
              onClick={onReply}
              className="h-[26px] px-0.5 text-xs font-medium text-ink-soft transition-colors hover:text-pen max-sm:h-9 max-sm:px-1"
            >
              Reply
            </button>
            <HeartButton tripId={tripId} note={note} />
            {mine ? (
              <OwnMenu tripId={tripId} note={note} hasReplies={hasReplies} onEdit={() => setEditing(true)} />
            ) : null}
          </div>
        )}
      </div>
    </article>
  );
}
