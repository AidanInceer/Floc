/**
 * One idea on the board (v0.2 ticket 09; redesigned 196). The sticky-note wash
 * and tilt went with the paper look — a card the viewer hasn't voted on is
 * outlined in blue instead, because "yours to do" is the one thing the board
 * has to say at a glance. Server component; voting is the client-only IdeaVotes.
 */
import { Avatar, Field, PASTEL_SKINS, Stack, Textarea, cx } from "@/components/ui";
import {
  ConfirmSubmit,
  Menu,
  Sheet,
  SubmitButton,
  menuDangerItemClass,
  menuItemClass,
} from "@/components/client-ui";
import { IdeaVotes } from "@/components/idea-votes";
import { NoteThread, type NoteRow } from "@/components/note-thread";
import type { VoteValue } from "@/db/schema";
import {
  castVote,
  clearVote,
  deleteIdea,
  editIdea,
  setIdeaPinned,
} from "@/app/trip/[id]/ideas/actions";

type IdeaVoteRow = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  value: VoteValue;
  tone?: string;
};

export type IdeaCardData = {
  id: number;
  note: string;
  createdBy: string;
  authorName: string;
  authorAvatar: string | null;
  authorTone?: string; // absent if no longer a member; Avatar falls back to name
  createdAt: Date;
  pinnedAt: Date | null; // group-wide (ticket 09)
  votes: IdeaVoteRow[];
  notes: NoteRow[];
};

export function IdeaCard({
  tripId,
  idea,
  viewerId,
  isAdmin,
  className,
}: {
  tripId: number;
  idea: IdeaCardData;
  viewerId: string;
  isAdmin: boolean;
  className?: string;
}) {
  // Author or any admin may remove — not author-only, so a stale idea can't
  // get stuck if the poster's gone quiet (v1 ticket 14).
  const canDelete = isAdmin || idea.createdBy === viewerId;
  const commentCount = idea.notes.reduce(
    (n, run) => n + 1 + run.replies.length,
    0,
  );
  const viewerVote = idea.votes.find((v) => v.userId === viewerId)?.value ?? null;
  const counts: Record<VoteValue, number> = {
    up: idea.votes.filter((v) => v.value === "up").length,
    dont_mind: idea.votes.filter((v) => v.value === "dont_mind").length,
    down: idea.votes.filter((v) => v.value === "down").length,
  };
  const pinned = idea.pinnedAt !== null;

  return (
    <li
      className={cx(
        "lift flex flex-col rounded-lg p-5",
        // Pastel by id — a card keeps its colour every visit, pinned or not.
        PASTEL_SKINS[idea.id % PASTEL_SKINS.length],
        // Pinned is marked by a ring, not a recolour (ticket 196 refresh). The
        // ring is currentColor — which the pastel skin sets to its own `-ink` —
        // so the outline matches the card's colour rather than fighting it.
        pinned && "shadow-[inset_0_0_0_2px_currentColor]",
        // No `opacity` quieting for zero-vote cards: opacity forms a stacking
        // context that painted over an open "…" menu from the card above it.
        className,
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

      <div
        className="mt-3 flex items-center gap-1.5 text-xs text-ink-faint"
        title={idea.authorName}
      >
        <Avatar
          name={idea.authorName}
          src={idea.authorAvatar}
          size={20}
          tone={idea.authorTone}
        />
        <span className="truncate">{idea.authorName}</span>
        <span className="nums">
          ·{" "}
          {idea.createdAt.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          })}
        </span>
      </div>

      <div className="mt-4">
        <IdeaVotes
          tripId={tripId}
          ideaId={idea.id}
          value={viewerVote}
          counts={counts}
          castVote={castVote}
          clearVote={clearVote}
        />
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
        {/* Modal, not inline expansion — a narrow card gave ~4 words a line,
            and expanding it shoved every card below into a different row. */}
        <Sheet
          trigger={
            // Replies count too, so an 8-comment run doesn't undersell itself.
            commentCount === 0
              ? "Add a comment"
              : `${commentCount} ${commentCount === 1 ? "comment" : "comments"}`
          }
          triggerVariant="ghost"
          // `!` throughout: fights buttonBase's utilities under Tailwind v4's
          // stylesheet-order cascade.
          triggerClassName="!border-none !px-0 !py-0 !font-sans !text-xs !normal-case !tracking-normal !text-pen whitespace-nowrap"
          title={idea.note}
          keepOpenOnSubmit
        >
          <NoteThread
            tripId={tripId}
            scope="idea"
            scopeId={idea.id}
            notes={idea.notes}
            viewerId={viewerId}
            isAdmin={isAdmin}
            placeholder="Why this one, or why not?"
          />
        </Sheet>
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

/**
 * An idea is free text, so a link arrives inside it rather than in a field of
 * its own (ticket 196). `rel` is belt and braces — the href is another member's
 * typing, not the app's.
 */
const URL_PATTERN = /(https?:\/\/[^\s<]+)/g;

function linkify(note: string) {
  return note.split(URL_PATTERN).map((part, i) =>
    i % 2 === 1 ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noreferrer noopener nofollow"
        className="text-pen underline underline-offset-2 hover:text-pen-deep"
      >
        {part.replace(/^https?:\/\//, "")}
      </a>
    ) : (
      part
    ),
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
