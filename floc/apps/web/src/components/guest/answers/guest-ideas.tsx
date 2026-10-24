"use client";

import { IdeaVoteButton } from "@/components/trip/ideas/idea-vote-button";
import { useSteadyOrder } from "@/components/trip/ideas/use-steady-order";
import { guestVoteIdea } from "@/app/invite/[token]/actions";
import type { GuestIdea } from "@/server/trips/guest-view";
import type { GuestAnswer } from "./use-guest-answer";

export function GuestIdeas({ token, ideas, answer }: { token: string; ideas: GuestIdea[]; answer: GuestAnswer }) {
  const ordered = useSteadyOrder([...ideas].sort((a, b) => b.votes - a.votes || b.id - a.id));
  return (
    <ul className="divide-y divide-rule">
      {ordered.map((idea) => (
        <li key={idea.id} className="flex items-center gap-3 py-2">
          <IdeaVoteButton
            type="button"
            title={idea.title}
            votes={idea.votes}
            mine={idea.mine}
            disabled={answer.pending}
            onClick={() => answer.run("ideas", () => guestVoteIdea(token, idea.id))}
          />
          <span className="min-w-0 flex-1 text-[15px] leading-snug text-ink">{idea.title}</span>
        </li>
      ))}
    </ul>
  );
}
