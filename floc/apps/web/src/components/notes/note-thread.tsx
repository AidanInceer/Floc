"use client";

// Discussion thread, shared by every surface that has one. Oldest-first by
// default; "most liked" is opt-in per thread (ticket 35), reordering runs only.
// Unit is the run (v0.2 ticket 06): replies are exactly one level deep — a
// reply-to-a-reply attaches to the same parent and names who it answers in the
// body, since a thread renders in a narrow panel.
// Client component because collapse/composer/sort state is local per thread —
// a dozen threads can be open on one screen, so a single ?sort= can't serve them.
import { useState, type ReactNode } from "react";

import { Avatar, Textarea, cx } from "@/components/system/ui";
import { ReactionGlyph } from "@/components/system/reaction-glyph";
import { FlockChevron } from "@/components/system/flock-chevron";
import {
  ActionForm,
  ConfirmSubmit,
  SubmitButton,
} from "@/components/system/client-ui";
import {
  addNote,
  deleteNote,
  editNote,
  react,
} from "@/app/trip/[id]/notes-actions";
import { REACTION_KINDS, type NoteScope, type ReactionKind } from "@/db/schema";
import {
  commentTime,
  sortRuns,
  type NoteRow,
  type NoteSort,
} from "@floc/core/notes/notes";

export type { NoteRow };

const REACTION_LABEL: Record<ReactionKind, string> = {
  heart: "Love this",
  up: "Agree",
  down: "Disagree",
};

const REACTION_TONE: Record<ReactionKind, string> = {
  heart: "bg-red-soft border-red-edge text-red",
  up: "bg-green-soft border-green-edge text-green",
  down: "bg-highlight-soft border-highlight-edge text-highlight-ink",
};

// Blurs on pointer release so a clicked button doesn't keep its comment's
// hover controls lit up. Keyboard activation fires click without mouseup, so
// tabbing still reveals everything via focus-within.
function blurOnPointer(e: { currentTarget: HTMLElement }) {
  e.currentTarget.blur();
}

function Reactions({ tripId, note }: { tripId: number; note: NoteRow }) {
  return (
    <>
      {REACTION_KINDS.map((kind) => {
        const { count, mine } = note.reactions[kind];
        return (
          <form key={kind} action={react.bind(null, tripId, note.id, kind)}>
            <button
              type="submit"
              aria-pressed={mine}
              onMouseUp={blurOnPointer}
              aria-label={
                count
                  ? `${REACTION_LABEL[kind]} — ${count}`
                  : REACTION_LABEL[kind]
              }
              title={REACTION_LABEL[kind]}
              className={cx(
                // Fixed height, not padding-derived — a count text node is
                // taller than the 13px glyph and would grow the row otherwise.
                "inline-flex h-[21px] items-center gap-1 rounded-full border px-1.5 font-mono text-[10.5px] leading-none tracking-[0.02em] transition-colors",
                // A left reaction is state, so it stays visible; an empty one
                // is an affordance, so it waits for hover.
                count
                  ? REACTION_TONE[kind]
                  : "border-transparent text-ink-faint opacity-0 group-hover/cm:opacity-100 group-focus-within/cm:opacity-100 hover:bg-sheet-2 [@media(hover:none)]:opacity-100",
                mine && "font-bold",
              )}
            >
              <ReactionGlyph kind={kind} mine={mine} />
              {count ? <span>{count}</span> : null}
            </button>
          </form>
        );
      })}
    </>
  );
}

function Comment({
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
  hasReplies: boolean; // deleting a top-level comment takes replies with it
  reply?: boolean; // smaller avatar/body inside a run
}) {
  const mine = note.createdBy === viewerId;
  const [editing, setEditing] = useState(false);

  return (
    <div className="group/cm flex gap-2.5 py-2">
      <Avatar
        name={note.authorName}
        icon={note.authorAvatarIcon}
        size={reply ? 22 : 26}
        tone={note.authorTone}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 text-[13px] leading-tight">
          <span className="font-semibold">{note.authorName}</span>
          {/* suppressHydrationWarning: label is computed from the clock, server
              and client can land a minute apart. */}
          <span
            suppressHydrationWarning
            className="font-mono text-[10.5px] tracking-[0.02em] text-ink-faint"
          >
            {commentTime(note.createdAt)}
          </span>
          {note.editedAt ? (
            <span className="font-mono text-[10.5px] tracking-[0.02em] text-ink-faint">
              edited
            </span>
          ) : null}
        </div>

        {editing ? (
          <ActionForm
            action={async (formData) => {
              const result = await editNote(tripId, note.id, formData);
              if (!result?.error) setEditing(false);
              return result;
            }}
            className="mt-1"
          >
            <Textarea
              name="body"
              rows={2}
              maxLength={2000}
              defaultValue={note.body}
              className="min-h-0 text-sm"
              autoFocus
            />
            <div className="mt-2 flex items-center gap-2">
              <SubmitButton variant="primary" pendingLabel="Saving…">
                Save
              </SubmitButton>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-[12.5px] text-ink-faint hover:text-ink-soft"
              >
                Cancel
              </button>
            </div>
          </ActionForm>
        ) : (
          <p
            className={cx(
              "mt-0.5 whitespace-pre-wrap",
              reply ? "text-[14px]" : "text-sm",
            )}
          >
            {note.body}
          </p>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[12.5px] text-ink-faint">
          <Reactions tripId={tripId} note={note} />
          <div className="ml-1 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onReply}
              className="opacity-0 hover:text-pen group-hover/cm:opacity-100 group-focus-within/cm:opacity-100 [@media(hover:none)]:opacity-100"
            >
              Reply
            </button>
            {mine && !editing ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="opacity-0 hover:text-pen group-hover/cm:opacity-100 group-focus-within/cm:opacity-100 [@media(hover:none)]:opacity-100"
              >
                Edit
              </button>
            ) : null}
            {mine ? (
              <form action={deleteNote.bind(null, tripId, note.id)}>
                <ConfirmSubmit
                  message={
                    hasReplies
                      ? "Delete this comment? The replies to it go too."
                      : "Delete this comment?"
                  }
                  confirmLabel="Delete it"
                  variant="ghost"
                  // hover:!bg-transparent: ghost's default hover wash read as a
                  // stray block next to Reply/Edit, which only change colour.
                className="!px-0 !py-0 !font-sans !text-[12.5px] !normal-case !tracking-normal !text-ink-faint opacity-0 group-hover/cm:opacity-100 group-focus-within/cm:opacity-100 hover:!bg-transparent hover:!text-pen [@media(hover:none)]:opacity-100"
                >
                  Delete
                </ConfirmSubmit>
              </form>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function Composer({
  tripId,
  scope,
  scopeId,
  replyTo,
  placeholder,
  label,
  variant,
  onDone,
  autoFocus,
}: {
  tripId: number;
  scope: NoteScope;
  scopeId: number;
  replyTo: number | null;
  placeholder: string;
  label: string;
  variant: "primary" | "secondary";
  onDone?: () => void;
  autoFocus?: boolean;
}) {
  return (
    <ActionForm action={addNote.bind(null, tripId, scope, scopeId, replyTo)}>
      <Textarea
        name="body"
        rows={2}
        maxLength={2000}
        placeholder={placeholder}
        className="min-h-0 text-sm"
        autoFocus={autoFocus}
      />
      <div className="mt-2 flex items-center gap-2">
        <SubmitButton variant={variant} pendingLabel="Posting…">
          {label}
        </SubmitButton>
        {onDone ? (
          <button
            type="button"
            onClick={onDone}
            className="text-[12.5px] text-ink-faint hover:text-ink-soft"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </ActionForm>
  );
}

function Run({
  tripId,
  scope,
  scopeId,
  note,
  viewerId,
}: {
  tripId: number;
  scope: NoteScope;
  scopeId: number;
  note: NoteRow;
  viewerId: string;
}) {
  const [replying, setReplying] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const count = note.replies.length;

  return (
    <div className="border-t border-dotted border-rule-strong pt-1 first:border-t-0 first:pt-0">
      <div className="relative">
        <Comment
          tripId={tripId}
          note={note}
          viewerId={viewerId}
          onReply={() => setReplying(true)}
          hasReplies={count > 0}
        />
        {count > 0 ? (
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-expanded={!collapsed}
            className="absolute top-2 right-0 inline-flex items-center gap-1 rounded-sm px-1 py-0.5 font-mono text-[10.5px] tracking-[0.02em] text-ink-faint hover:bg-sheet-2 hover:text-pen"
          >
            {collapsed
              ? `${count} ${count === 1 ? "reply" : "replies"}`
              : "Hide"}
            <FlockChevron
              size={9}
              className={cx(
                "transition-transform",
                collapsed ? "rotate-0" : "rotate-180",
              )}
            />
          </button>
        ) : null}
      </div>

      {count > 0 && !collapsed ? (
        // Dashed 1px rule: 2px solid read as a different kind of line, and
        // touching the dotted run separator looked like a broken table border.
        <div className="mb-2.5 ml-[35px] border-l border-dashed border-rule-strong pl-3.5">
          {note.replies.map((r) => (
            <Comment
              key={r.id}
              tripId={tripId}
              note={r}
              viewerId={viewerId}
              onReply={() => setReplying(true)}
              hasReplies={false}
              reply
            />
          ))}
        </div>
      ) : null}

      {replying ? (
        // Same weight/dash as the replies' rule since it sits in the same column.
        <div className="mt-1 mb-2 ml-[35px] border-l border-dashed border-pen-soft pt-1 pl-3.5">
          <Composer
            tripId={tripId}
            scope={scope}
            scopeId={scopeId}
            replyTo={note.id}
            placeholder={`Reply to ${note.authorName}…`}
            label="Reply"
            variant="primary"
            autoFocus
            onDone={() => setReplying(false)}
          />
        </div>
      ) : null}
    </div>
  );
}

// Thread furniture, not one of the page's sort tabs — the board's filled-pen
// buttons would shout inside a 230px note's modal.
function SortToggle({
  value,
  onSelect,
}: {
  value: NoteSort;
  onSelect: (next: NoteSort) => void;
}) {
  const options: { value: NoteSort; label: string }[] = [
    { value: "oldest", label: "Oldest" },
    { value: "liked", label: "Most liked" },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Sort comments"
      className="flex items-center gap-1"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onSelect(o.value)}
          onMouseUp={blurOnPointer}
          className={cx(
            "rounded-sm px-1.5 py-0.5 font-mono text-[10.5px] tracking-[0.02em]",
            value === o.value
              ? "bg-sheet-3 font-bold text-ink"
              : "text-ink-faint hover:bg-sheet-2 hover:text-pen",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function NoteThread({
  tripId,
  scope,
  scopeId,
  notes,
  viewerId,
  placeholder = "Add a comment…",
  toolbar,
}: {
  tripId: number;
  scope: NoteScope;
  scopeId: number;
  notes: NoteRow[];
  viewerId: string;
  placeholder?: string;
  /** The owning card's own controls, so they share the thread's header row
      rather than stacking above it (ticket 233). */
  toolbar?: ReactNode;
}) {
  const [sort, setSort] = useState<NoteSort>("oldest");
  const runs = sortRuns(notes, sort);

  return (
    <div className="mt-2">
      {toolbar || notes.length > 1 ? (
        <div className="mb-1 flex items-center gap-2 border-t border-rule pt-2">
          <div className="min-w-0 flex-1">
            {notes.length > 1 ? (
              <SortToggle value={sort} onSelect={setSort} />
            ) : null}
          </div>
          {toolbar}
        </div>
      ) : null}
      {/* No empty state (ticket 75) — the composer below is the only thing to
          do on an empty thread. */}
      {notes.length === 0 ? null : (
        <div className="flex flex-col">
          {runs.map((n) => (
            <Run
              key={n.id}
              tripId={tripId}
              scope={scope}
              scopeId={scopeId}
              note={n}
              viewerId={viewerId}
            />
          ))}
        </div>
      )}

      <div
        className={cx("mt-3", notes.length > 0 && "border-t border-rule pt-3")}
      >
        <Composer
          tripId={tripId}
          scope={scope}
          scopeId={scopeId}
          replyTo={null}
          placeholder={placeholder}
          label="Add comment"
          variant={notes.length === 0 ? "primary" : "secondary"}
        />
      </div>
    </div>
  );
}
