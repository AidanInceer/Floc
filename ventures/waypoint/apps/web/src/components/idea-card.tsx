/**
 * One idea on the board (v0.2 ticket 09; redesigned 196). The sticky-note wash
 * and tilt went with the paper look — a card the viewer hasn't voted on is
 * outlined in blue instead, because "yours to do" is the one thing the board
 * has to say at a glance.
 *
 * Discussion is inline, not a modal — the chevron unfolds it into IdeaDiscussion,
 * a full-width row the board places (and owns the open state for, one at a time).
 */
"use client";

import { Field, PASTEL_SKINS, Stack, Textarea, cx } from "@/components/ui";
import {
  ConfirmSubmit,
  Menu,
  Sheet,
  SubmitButton,
  menuDangerItemClass,
  menuItemClass,
} from "@/components/client-ui";
import { IdeaByline, IdeaVoteBar } from "@/components/idea-byline";
import { linkify } from "@/components/linkify";
import type { IdeaCardData } from "@/components/idea-data";
import {
  deleteIdea,
  editIdea,
  setIdeaPinned,
} from "@/app/trip/[id]/ideas/actions";

export function IdeaCard({
  tripId,
  idea,
  viewerId,
  isAdmin,
  open,
  onToggle,
}: {
  tripId: number;
  idea: IdeaCardData;
  viewerId: string;
  isAdmin: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  // Author or any admin may remove — not author-only, so a stale idea can't
  // get stuck if the poster's gone quiet (v1 ticket 14).
  const canDelete = isAdmin || idea.createdBy === viewerId;
  const commentCount = idea.notes.reduce(
    (n, run) => n + 1 + run.replies.length,
    0,
  );
  const pinned = idea.pinnedAt !== null;

  return (
    <li
      data-idea-card={idea.id}
      className={cx(
        "lift flex flex-col rounded-lg p-5",
        PASTEL_SKINS[idea.id % PASTEL_SKINS.length],
        // The open outline stands in for the pin ring while expanded — both at
        // once read as a double border. The filled pin icon still says "pinned".
        pinned && !open && "shadow-[inset_0_0_0_2px_currentColor]",
        // currentColor: the pastel skin sets it to its own -ink, so the open
        // outline matches the card rather than fighting it (as the pin ring does).
        open && "outline outline-2 outline-offset-2 outline-current",
      )}
    >
      <div className="flex items-start justify-end gap-2">
        {/* Any member may pin — not an admin power (rule 6). */}
        <form action={setIdeaPinned.bind(null, tripId, idea.id, !pinned)}>
          <button
            type="submit"
            aria-pressed={pinned}
            className={cx(
              "flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-sheet-2",
              pinned ? "text-pen" : "text-ink-faint hover:text-ink",
            )}
          >
            <PinIcon filled={pinned} />
            <span className="sr-only">
              {pinned ? "Pinned to the top — unpin" : "Pin to the top"}
            </span>
          </button>
        </form>
      </div>

      <p className="mt-1 text-sm break-words">{linkify(idea.note)}</p>

      <div className="mt-3">
        <IdeaByline idea={idea} />
      </div>

      <div className="mt-4">
        <IdeaVoteBar tripId={tripId} idea={idea} viewerId={viewerId} />
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={`idea-discussion-${idea.id}`}
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-rule-strong bg-sheet px-2.5 py-1 text-[11px] text-ink-soft transition-colors hover:border-pen hover:text-pen"
        >
          {/* Replies count too, so an 8-comment run doesn't undersell itself. */}
          {commentCount === 0
            ? "Discuss"
            : `${commentCount} ${commentCount === 1 ? "comment" : "comments"}`}
          <svg
            viewBox="0 0 24 24"
            width="12"
            height="12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
            className={cx("transition-transform", open && "rotate-180")}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {/* Edit and Remove behind one triple-dot (ticket 125 pattern). Both open
            a native <dialog> inside the menu, which is why Menu doesn't close on
            an inside click. */}
        {canDelete ? (
          <Menu label="Idea actions">
            <Sheet
              trigger="Edit"
              bareTrigger
              triggerClassName={menuItemClass}
              title="Edit idea"
            >
              <form action={editIdea.bind(null, tripId, idea.id)}>
                <Stack gap={3}>
                  <Field label="Idea">
                    <Textarea
                      name="note"
                      required
                      rows={3}
                      maxLength={2000}
                      defaultValue={idea.note}
                    />
                  </Field>
                  <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
                </Stack>
              </form>
            </Sheet>
            <form action={deleteIdea.bind(null, tripId, idea.id)}>
              <ConfirmSubmit
                message="Remove this idea for everyone? Its comments and votes go with it."
                confirmLabel="Remove it"
                variant="ghost"
                className={menuDangerItemClass}
              >
                Remove
              </ConfirmSubmit>
            </form>
          </Menu>
        ) : null}
      </div>
    </li>
  );
}

function PinIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 3h6l-1 5 3.5 3.5H6.5L10 8 9 3Z" />
      <path d="M12 11.5V21" fill="none" />
    </svg>
  );
}
