// One idea, as a sticky note on the board (v0.2 ticket 09). Server component;
// voting is delegated to the client-only IdeaVotes.
import { Avatar, cx } from "@/components/ui";
import { ConfirmSubmit, Sheet } from "@/components/client-ui";
import { IdeaVotes } from "@/components/idea-votes";
import { NoteThread, type NoteRow } from "@/components/note-thread";
import type { VoteValue } from "@/db/schema";
import {
  castVote,
  clearVote,
  deleteIdea,
  setIdeaPinned,
} from "@/app/trip/[id]/ideas/actions";

export type IdeaVoteRow = {
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

// Wash and tilt are derived from the idea's id, never stored — a note keeps
// its look across reloads/sorts without any persisted layout state (ticket 09).
const WASHES = ["wash-0", "wash-1", "wash-2", "wash-3", "wash-4", "wash-5"] as const;
const TILTS = ["-1.4deg", "1deg", "-0.6deg", "1.6deg", "-1.1deg", "0.7deg"] as const;

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
  const slot = idea.id % 6;
  const pinned = idea.pinnedAt !== null;

  return (
    <li
      // Pinned notes get no tilt (reads as clutter in their own row). Set via
      // --tilt not rotate-0 since .idea-note owns transform via the cascade.
      style={{ "--tilt": pinned ? "0deg" : TILTS[slot] } as React.CSSProperties}
      className={cx(
        // pt-7 clears the tape, a background layer on .idea-note.
        "idea-note relative break-inside-avoid rounded-sm border border-rule p-4 pt-7 shadow-lifted",
        WASHES[slot],
        className,
      )}
    >
      {/* Any member may pin — not an admin power (rule 6). */}
      <form
        action={setIdeaPinned.bind(null, tripId, idea.id, !pinned)}
        className="absolute right-1.5 top-5"
      >
        <button
          type="submit"
          aria-pressed={pinned}
          title={pinned ? "Pinned to the top — unpin" : "Pin to the top"}
          className={cx(
            "flex h-6 w-6 items-center justify-center rounded-full border border-transparent transition-colors hover:border-rule-strong hover:bg-sheet/80",
            pinned ? "text-pen" : "text-ink-faint hover:text-ink",
          )}
        >
          <PinIcon filled={pinned} />
          <span className="sr-only">
            {pinned ? "Pinned to the top — unpin" : "Pin to the top"}
          </span>
        </button>
      </form>

      <p className="pr-7 text-sm">{idea.note}</p>

      {/* Name dropped in favour of the coloured avatar; kept for screen readers/hover. */}
      <div
        className="mt-2.5 flex items-center gap-1.5 text-xs text-ink-faint"
        title={idea.authorName}
      >
        <Avatar
          name={idea.authorName}
          src={idea.authorAvatar}
          size={18}
          tone={idea.authorTone}
        />
        <span className="sr-only">{idea.authorName}, </span>
        {idea.createdAt.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        })}
      </div>

      <div className="mt-3">
        <IdeaVotes
          tripId={tripId}
          ideaId={idea.id}
          value={viewerVote}
          counts={counts}
          castVote={castVote}
          clearVote={clearVote}
        />
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-dotted border-rule pt-2">
        {/* Modal, not inline expansion — a 230px note gave ~4 words a line,
            and expanding it shoved every note below into a different column. */}
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
          <form
            action={deleteIdea.bind(null, tripId, idea.id)}
          >
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
