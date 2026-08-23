/**
 * One idea on the board (v0.2 ticket 09; redesigned 196). The sticky-note wash
 * and tilt went with the paper look — a card the viewer hasn't voted on is
 * outlined in blue instead, because "yours to do" is the one thing the board
 * has to say at a glance. Server component; voting is the client-only IdeaVotes.
 */
import { Avatar, cx } from "@/components/ui";
import { ConfirmSubmit, Sheet } from "@/components/client-ui";
import { IdeaVotes } from "@/components/idea-votes";
import { ReactionGlyph, type GlyphKind } from "@/components/reaction-glyph";
import { NoteThread, type NoteRow } from "@/components/note-thread";
import type { VoteValue } from "@/db/schema";
import {
  castVote,
  clearVote,
  deleteIdea,
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

const VOTE_GLYPH: Record<VoteValue, { glyph: GlyphKind; label: string }> = {
  up: { glyph: "heart", label: "Keen" },
  dont_mind: { glyph: "up", label: "Don't mind" },
  down: { glyph: "down", label: "Rather not" },
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
        "lift flex flex-col rounded-lg bg-sheet p-5",
        // The board's only blue: nobody else's vote is the viewer's problem.
        viewerVote === null
          ? "shadow-[inset_0_0_0_2px_var(--pen)]"
          // Nothing anyone wants stays on the board, quietened — a group
          // changes its mind (ticket 196).
          : idea.votes.length === 0
            ? "opacity-75"
            : "shadow-[inset_0_0_0_1.5px_var(--rule)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="typed">
          {viewerVote === null ? "Your turn" : pinned ? "Pinned" : " "}
        </span>
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

      {/* Who voted which way, without opening anything (ticket 196). */}
      {idea.votes.length > 0 ? (
        <ul className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1.5">
          {(Object.keys(VOTE_GLYPH) as VoteValue[])
            .filter((v) => idea.votes.some((row) => row.value === v))
            .map((v) => (
              <li key={v} className="flex items-center gap-1.5 text-ink-soft">
                <ReactionGlyph kind={VOTE_GLYPH[v].glyph} mine={false} size={13} />
                <span className="sr-only">{VOTE_GLYPH[v].label}:</span>
                <span className="flex">
                  {idea.votes
                    .filter((row) => row.value === v)
                    .map((row, i) => (
                      <span key={row.userId} className={cx(i > 0 && "-ml-1.5")}>
                        <Avatar
                          name={row.name}
                          src={row.avatarUrl}
                          size={18}
                          tone={row.tone}
                        />
                      </span>
                    ))}
                </span>
              </li>
            ))}
        </ul>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-rule pt-3">
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
        {canDelete ? (
          <form action={deleteIdea.bind(null, tripId, idea.id)}>
            <ConfirmSubmit
              message="Remove this idea for everyone? Its comments and votes go with it."
              confirmLabel="Remove it"
              variant="ghost"
              className="!border-none !px-0 !py-0 !font-sans !text-xs !normal-case !tracking-normal !text-ink-faint whitespace-nowrap"
            >
              Remove
            </ConfirmSubmit>
          </form>
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
