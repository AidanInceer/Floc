"use client";

/**
 * A discussion thread — one component for every surface that has one (ideas
 * and day events today).
 *
 * Oldest-first by default, deliberately: a thread is an argument you follow
 * from the start, not a feed. "Most liked" is opt-in per thread (ticket 35) and
 * reorders the runs only — never the replies inside one.
 *
 * **The unit is the run** (v0.2 ticket 06): one top-level comment plus its
 * replies, separated from the next run by a dotted rule, the replies indented
 * once behind a solid one. Replies are **exactly one level deep** — replying
 * to a reply attaches to the same parent and names who it answers in the body
 * instead. Unbounded nesting was rejected because Ideas renders this in a
 * `max-w-lg` modal, where the fourth level would be a few words a line.
 *
 * A client component, unusually for this codebase, because three things here
 * are genuinely stateful with no server round-trip worth making: whether a run
 * is collapsed, which reply composer is open, and how the runs are ordered.
 * The order is local on purpose: Ideas puts a thread in a modal per note, so
 * there can be a dozen on one screen, and a `?sort=` in the URL — the way the
 * idea board itself does it — can only say one thing for all of them. The
 * server
 * actions are imported directly, which is allowed and keeps the writes on the
 * server where they belong.
 */
import { useState } from "react";

import { Avatar, Textarea, cx } from "@/components/ui";
import {
  ActionForm,
  ConfirmSubmit,
  SubmitButton,
} from "@/components/client-ui";
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
} from "@/lib/notes";

export type { NoteRow };

/** Render order is fixed: heart, thumbs up, thumbs down. */
const REACTION_LABEL: Record<ReactionKind, string> = {
  heart: "Love this",
  up: "Agree",
  down: "Disagree",
};

/** Wash, edge and ink for each — the palette's own tints, not new colours. */
const REACTION_TONE: Record<ReactionKind, string> = {
  heart: "bg-red-soft border-red-edge text-red",
  up: "bg-green-soft border-green-edge text-green",
  down: "bg-highlight-soft border-highlight-edge text-highlight-ink",
};

/**
 * Hidden-until-hover controls are also revealed by `focus-within`, so keyboard
 * users can reach them. But a mouse click leaves focus *on* the button, which
 * kept a whole comment's controls lit up while you carried on using the rest of
 * the page — you had to click elsewhere to put it away. Dropping focus on
 * pointer release only affects the mouse: keyboard activation fires `click`
 * without a `mouseup`, so tabbing still reveals everything.
 */
function blurOnPointer(e: { currentTarget: HTMLElement }) {
  e.currentTarget.blur();
}

const HEART =
  "M7 12.1C3.3 9.4 1.5 7.5 1.5 5.4A3.2 3.2 0 0 1 7 3.5a3.2 3.2 0 0 1 5.5 1.9c0 2.1-1.8 4-5.5 6.7Z";
const THUMB = [
  "M4.3 6.1 6.9 1.5a1.35 1.35 0 0 1 2 1.25V5.5h2.9a1.2 1.2 0 0 1 1.16 1.53l-1.1 3.85A1.5 1.5 0 0 1 10.4 12H4.3Z",
  "M1.3 6.1h2.4V12H1.3Z",
];

function ReactionGlyph({ kind, mine }: { kind: ReactionKind; mine: boolean }) {
  const paths = kind === "heart" ? [HEART] : THUMB;
  return (
    <svg
      viewBox="0 0 14 14"
      aria-hidden="true"
      className="h-[13px] w-[13px] shrink-0"
    >
      {/* Thumbs down is thumbs up, turned over. On a `<g>`, not on the `<svg>`
          itself — there the attribute is read as a CSS transform against the
          element box and shunts the glyph out of the row. */}
      <g transform={kind === "down" ? "rotate(180 7 7)" : undefined}>
        {paths.map((d) => (
          <path
            key={d}
            d={d}
            /* Your own reaction fills in; other people's stay outlined. Same
             move Ideas' vote control makes — and the count, not the colour,
             is what carries the state (CLAUDE.md: never colour alone). */
            fill={mine ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={mine ? 0 : 1.25}
            strokeLinejoin="round"
          />
        ))}
      </g>
    </svg>
  );
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
                /* Fixed height, not padding-derived: gaining a count adds a
                   text node taller than the 13px glyph, which grew the row and
                   nudged the rule below the comment down as you reacted. */
                "inline-flex h-[21px] items-center gap-1 rounded-full border px-1.5 font-mono text-[10.5px] leading-none tracking-[0.02em] transition-colors",
                /* A reaction someone has left is state, so it stays on screen.
                   An empty one is an affordance, so it waits for a hover —
                   otherwise you could not see what a comment had collected
                   without hovering every comment in the thread. */
                count
                  ? REACTION_TONE[kind]
                  : "border-transparent text-ink-faint opacity-0 group-hover/cm:opacity-100 group-focus-within/cm:opacity-100 hover:bg-sheet-2 [@media(hover:none)]:opacity-100",
                mine && "font-bold",
              )}
            >
              <ReactionGlyph kind={kind} mine={mine} />
              {count ? <span>{count}</span> : null}
              {/* See `blurOnPointer` — without this the row you just reacted
                  on stays lit up while you use the rest of the page. */}
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
  isAdmin,
  onReply,
  hasReplies,
  reply,
}: {
  tripId: number;
  note: NoteRow;
  viewerId: string;
  isAdmin: boolean;
  onReply: () => void;
  /** Deleting a top-level comment takes its replies with it — say so first. */
  hasReplies: boolean;
  /** Smaller avatar and body inside a run. */
  reply?: boolean;
}) {
  const mine = note.createdBy === viewerId;
  const canDelete = isAdmin || mine;
  const [editing, setEditing] = useState(false);

  return (
    <div className="group/cm flex gap-2.5 py-2">
      <Avatar
        name={note.authorName}
        src={note.authorAvatar}
        size={reply ? 22 : 26}
        tone={note.authorTone}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 text-[13px] leading-tight">
          <span className="font-semibold">{note.authorName}</span>
          {/* The label is computed from the clock, so server and client can
              land a minute apart on a comment posted seconds ago. */}
          <span
            suppressHydrationWarning
            className="font-mono text-[10.5px] tracking-[0.02em] text-ink-faint"
          >
            {commentTime(note.createdAt)}
          </span>
          {/* Said out loud, because the replies underneath are arguing with
              whatever this comment said at the time. */}
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
          {/* The word controls get their own, wider gap. The reactions are
              glyph-sized and read as one cluster at 6px; words at that spacing
              ran together. `ml-1` keeps the step in from the reactions the
              same as it was. */}
          <div className="ml-1 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onReply}
              className="opacity-0 hover:text-pen group-hover/cm:opacity-100 group-focus-within/cm:opacity-100 [@media(hover:none)]:opacity-100"
            >
              Reply
            </button>
            {/* Your own words only — an admin can delete a comment but never
              rewrite one in someone else's name (rule 6). */}
            {mine && !editing ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="opacity-0 hover:text-pen group-hover/cm:opacity-100 group-focus-within/cm:opacity-100 [@media(hover:none)]:opacity-100"
              >
                Edit
              </button>
            ) : null}
            {canDelete ? (
              <form action={deleteNote.bind(null, tripId, note.id)}>
                <ConfirmSubmit
                  message={
                    hasReplies
                      ? "Delete this comment? The replies to it go too."
                      : "Delete this comment?"
                  }
                  confirmLabel="Delete it"
                  variant="ghost"
                  /* `hover:!bg-transparent`: the ghost variant washes its
                   background pen-soft on hover, which is right for a standalone
                   ghost button but read as a stray blue block next to Reply and
                   Edit, which only change colour. Same hover as those two. */
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
  isAdmin,
}: {
  tripId: number;
  scope: NoteScope;
  scopeId: number;
  note: NoteRow;
  viewerId: string;
  isAdmin: boolean;
}) {
  const [replying, setReplying] = useState(false);
  /** Replies show by default — collapsing is for getting a long run out of
      the way, not for hiding the conversation until you ask for it. */
  const [collapsed, setCollapsed] = useState(false);
  const count = note.replies.length;

  return (
    <div className="border-t border-dotted border-rule-strong pt-1 first:border-t-0 first:pt-0">
      <div className="relative">
        <Comment
          tripId={tripId}
          note={note}
          viewerId={viewerId}
          isAdmin={isAdmin}
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
            <span
              aria-hidden="true"
              className={cx(
                "text-[9px] leading-none transition-transform",
                collapsed ? "rotate-0" : "rotate-180",
              )}
            >
              ▾
            </span>
          </button>
        ) : null}
      </div>

      {count > 0 && !collapsed ? (
        /* The rule down the left is what makes a reply read as *attached*
           rather than as a top-level comment that happens to sit further
           right. Dashed and 1px, matching the dotted run separator it meets —
           at 2px solid it read as a different kind of line — and stopped short
           of that separator by the bottom margin, because the two touching at
           a corner looked like a broken table border. */
        <div className="mb-2.5 ml-[35px] border-l border-dashed border-rule-strong pl-3.5">
          {note.replies.map((r) => (
            <Comment
              key={r.id}
              tripId={tripId}
              note={r}
              viewerId={viewerId}
              isAdmin={isAdmin}
              onReply={() => setReplying(true)}
              hasReplies={false}
              reply
            />
          ))}
        </div>
      ) : null}

      {replying ? (
        /* Same weight and dash as the replies' rule — it sits in the same
           column, so a second line style there read as a second structure. */
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

/**
 * Thread order, in the same mono-caps vocabulary as the run's "Hide" control —
 * this is thread furniture, not one of the page's own sort tabs, and it sits
 * inside a 230px note's modal where the board's filled-pen buttons would shout.
 */
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
      className="mb-1 flex items-center justify-end gap-1"
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
  isAdmin,
  placeholder = "Add a comment…",
  /** What the thread hangs off, in the empty state's second line. */
  invitation = "A comment is where you say why — which is the bit that actually changes anyone's mind.",
}: {
  tripId: number;
  scope: NoteScope;
  scopeId: number;
  notes: NoteRow[];
  viewerId: string;
  isAdmin: boolean;
  placeholder?: string;
  invitation?: string;
}) {
  const [sort, setSort] = useState<NoteSort>("oldest");
  const runs = sortRuns(notes, sort);

  return (
    <div className="mt-2">
      {notes.length === 0 ? (
        /* An invitation, not a prompt. The old empty state was the string
           "Add a note", which is a label on a button pretending to be a
           state — the same fix v1 tickets 13 and 14 made elsewhere. */
        <div className="rounded-sm border border-dashed border-rule-strong bg-sheet-2 px-4 py-3.5">
          <p className="text-sm">
            Nobody&rsquo;s said anything about this yet.
          </p>
          <p className="mt-1 text-[13.5px] text-ink-soft">{invitation}</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {/* Nothing to sort with one run, and the control would read as a
              claim that there's more conversation than there is. */}
          {notes.length > 1 ? (
            <SortToggle value={sort} onSelect={setSort} />
          ) : null}
          {runs.map((n) => (
            <Run
              key={n.id}
              tripId={tripId}
              scope={scope}
              scopeId={scopeId}
              note={n}
              viewerId={viewerId}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      {/* Fenced off by a solid rule so it doesn't read as a reply to the last
          run. Primary on an empty thread, where writing the first comment is
          the only thing to do on the screen. */}
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
