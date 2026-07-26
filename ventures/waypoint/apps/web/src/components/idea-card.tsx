/**
 * One idea: note, tally, the viewer's own vote control, and who-voted-what
 * behind a disclosure (ticket 14). Server component — voting itself is
 * delegated to the client-only VoteControl.
 */
import { AvatarRow, Avatar, Badge, cx } from "@/components/ui";
import { ConfirmSubmit } from "@/components/client-ui";
import { VoteControl } from "@/components/vote-control";
import { NoteThread, type NoteRow } from "@/components/note-thread";
import type { VoteValue } from "@/db/schema";
import { castVote, clearVote, deleteIdea } from "@/app/trip/[id]/ideas/actions";

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
  votes: IdeaVoteRow[];
  /**
   * The idea's discussion thread. A vote says how you feel; a note says why,
   * and "why" is what actually settles an argument about Croatia.
   */
  notes: NoteRow[];
};

const GROUPS: { value: VoteValue; label: string; tone: "agreed" | "neutral" | "action" }[] = [
  { value: "up", label: "Keen", tone: "agreed" },
  { value: "dont_mind", label: "Don't mind", tone: "neutral" },
  { value: "down", label: "Rather not", tone: "action" },
];

export function IdeaCard({
  tripId,
  idea,
  viewerId,
  isAdmin,
}: {
  tripId: number;
  idea: IdeaCardData;
  viewerId: string;
  isAdmin: boolean;
}) {
  // Author or any admin may remove — not author-only, so a stale idea can't
  // get stuck if the poster's gone quiet (ticket 14).
  const canDelete = isAdmin || idea.createdBy === viewerId;
  const viewerVote = idea.votes.find((v) => v.userId === viewerId)?.value ?? null;
  const byValue = (v: VoteValue) => idea.votes.filter((row) => row.value === v);
  const hasAnyVotes = idea.votes.length > 0;

  return (
    <li className="rounded-md border border-rule bg-sheet p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Avatar
            name={idea.authorName}
            src={idea.authorAvatar}
            size={32}
            tone={idea.authorTone}
          />
          <div>
            <p className="text-sm">{idea.note}</p>
            <p className="mt-1 text-xs text-ink-faint">
              {idea.authorName} ·{" "}
              {idea.createdAt.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}
            </p>
          </div>
        </div>
        {canDelete ? (
          <form
            action={async () => {
              "use server";
              await deleteIdea(tripId, idea.id);
            }}
          >
            {/* Author or admin, per ticket 14 — a stuck stale idea shouldn't
                need the original poster to still be around. */}
            <ConfirmSubmit message="Remove this idea for everyone?" variant="ghost">
              Remove
            </ConfirmSubmit>
          </form>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <VoteControl
          tripId={tripId}
          ideaId={idea.id}
          value={viewerVote}
          castVote={castVote}
          clearVote={clearVote}
        />

        {/* Tally as text-labelled badges — never colour/emoji alone. */}
        <div className="flex items-center gap-1.5">
          {GROUPS.map((g) => (
            <Badge key={g.value} tone={g.tone}>
              {g.label} {byValue(g.value).length}
            </Badge>
          ))}
        </div>
      </div>

      {hasAnyVotes ? (
        <details className="mt-2 group">
          <summary className="cursor-pointer text-xs text-ink-faint hover:text-ink-soft">
            Who voted
          </summary>
          <div className="mt-2 flex flex-col gap-2">
            {GROUPS.map((g) => {
              const rows = byValue(g.value);
              if (rows.length === 0) return null;
              return (
                <div key={g.value} className="flex items-center gap-2">
                  <span className={cx("w-24 shrink-0 text-xs font-medium")}>
                    {g.label}
                  </span>
                  <AvatarRow
                    people={rows.map((r) => ({
                      name: r.name,
                      avatarUrl: r.avatarUrl,
                      tone: r.tone,
                    }))}
                    size={22}
                  />
                </div>
              );
            })}
          </div>
        </details>
      ) : (
        // Abstaining is legitimate, not a problem — no "nobody has voted"
        // warning tone here.
        <p className="mt-2 text-xs text-ink-faint">No votes yet</p>
      )}

      <div className="mt-3 border-t border-dotted border-rule pt-2">
        <NoteThread
          tripId={tripId}
          scope="idea"
          scopeId={idea.id}
          notes={idea.notes}
          viewerId={viewerId}
          isAdmin={isAdmin}
          placeholder="Why this one, or why not?"
        />
      </div>
    </li>
  );
}
