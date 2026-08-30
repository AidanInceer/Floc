/**
 * Who posted an idea, and the vote bar under it — shared by the board card and
 * the discussion panel, which show the same two things at the same size.
 */
"use client";

import { Avatar } from "@/components/ui";
import { IdeaVotes } from "@/components/idea-votes";
import type { IdeaCardData } from "@/components/idea-data";
import type { VoteValue } from "@/db/schema";
import { castVote, clearVote } from "@/app/trip/[id]/notes/actions";

export function IdeaByline({ idea }: { idea: IdeaCardData }) {
  return (
    <div
      className="flex items-center gap-1.5 text-xs text-ink-faint"
      title={idea.authorName}
    >
      <Avatar
        name={idea.authorName}
        src={idea.authorAvatar}
        size={20}
        tone={idea.authorTone}
      />
      <span className="truncate">{idea.authorName}</span>
    </div>
  );
}

export function IdeaVoteBar({
  tripId,
  idea,
  viewerId,
}: {
  tripId: number;
  idea: IdeaCardData;
  viewerId: string;
}) {
  const counts: Record<VoteValue, number> = {
    up: idea.votes.filter((v) => v.value === "up").length,
    dont_mind: idea.votes.filter((v) => v.value === "dont_mind").length,
    down: idea.votes.filter((v) => v.value === "down").length,
  };

  return (
    <IdeaVotes
      tripId={tripId}
      ideaId={idea.id}
      value={idea.votes.find((v) => v.userId === viewerId)?.value ?? null}
      counts={counts}
      castVote={castVote}
      clearVote={clearVote}
    />
  );
}
