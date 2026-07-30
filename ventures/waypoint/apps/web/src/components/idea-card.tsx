/**
 * One idea, as a sticky note on the board (v0.2 ticket 09). Was a full-width
 * list row that read like a form; the model behind it is unchanged from v1
 * ticket 14 — only the density and the arrangement moved.
 *
 * Server component. Voting is delegated to the client-only IdeaVotes; the pin
 * and the delete are plain server-action forms.
 */
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
  /** The voter's trip avatar colour — see `TripMember.tone`. */
  tone?: string;
};

export type IdeaCardData = {
  id: number;
  note: string;
  createdBy: string;
  authorName: string;
  authorAvatar: string | null;
  /** The author's trip avatar colour — see `TripMember.tone`. Absent if they
      are no longer a member, in which case Avatar falls back to the name. */
  authorTone?: string;
  createdAt: Date;
  /** Pinned to the top of the board, group-wide (ticket 09). */
  pinnedAt: Date | null;
  votes: IdeaVoteRow[];
  /**
   * The idea's discussion thread. A vote says how you feel; a comment says
   * why, and "why" is what actually settles an argument about Croatia.
   */
  notes: NoteRow[];
};

/**
 * Every note is a different pastel with a slightly different tilt, so the
 * board reads as paper rather than as a grid. Both are derived from the idea's
 * id, never stored: a note keeps its look across reloads and sort changes, and
 * the board still owns no layout state (ticket 09 ruled a persisted x/y out of
 * scope — a model change, not a presentation one).
 */
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
  /** The pinned row sizes its notes explicitly; the board lets columns do it. */
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
      /* A pinned note sits in its own row above the board, where the tilt
         reads as clutter rather than as character — so it gets no tilt. Set
         through `--tilt` rather than a `rotate-0` class because `.idea-note`
         owns the `transform` property outright and would win the cascade. */
      style={{ "--tilt": pinned ? "0deg" : TILTS[slot] } as React.CSSProperties}
      className={cx(
        // pt-7 clears the tape, which is a background layer on `.idea-note`
        // rather than an overhanging tab — see the CSS for why.
        "idea-note relative break-inside-avoid rounded-sm border border-rule p-4 pt-7 shadow-lifted",
        WASHES[slot],
        className,
      )}
    >
      {/*
        Pin, top-right: an outline drawing-pin that fills in when pinned. Any
        member may pin — it says "the group is looking at this one", which
        isn't an admin power (CLAUDE.md rule 6 keeps those to four).
      */}
      <form
        action={async () => {
          "use server";
          await setIdeaPinned(tripId, idea.id, !pinned);
        }}
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

      {/*
        Avatar and date only — the author's name in full took a whole line of a
        sticky note to repeat what the coloured avatar already says (one person
        is one colour across every tab). The name stays available to screen
        readers and on hover.
      */}
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
        {/*
          The thread opens in a modal rather than expanding inside the note.
          A `<details>` in a 230px-wide sticky note gave the conversation about
          four words a line, which is unreadable — and expanding it shoved every
          note below it into a different column. The modal gives the argument
          room without disturbing the board.
        */}
        <Sheet
          trigger={
            /* Replies count too — the footer says how much conversation is in
               there, and "2 comments" on a run of eight would undersell it. */
            commentCount === 0
              ? "Add a comment"
              : `${commentCount} ${commentCount === 1 ? "comment" : "comments"}`
          }
          triggerVariant="ghost"
          /* `!` throughout: these fight `buttonBase`'s own utilities, and in
             Tailwind v4 the stylesheet's order decides, not the class list's. */
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
            action={async () => {
              "use server";
              await deleteIdea(tripId, idea.id);
            }}
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

/** A drawing pin: outline when unpinned, filled ink when pinned. */
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
