"use client";

import { IdeaVoteButton } from "@/components/trip/ideas/idea-vote-button";
import { useSteadyOrder } from "@/components/trip/ideas/use-steady-order";
import { cx } from "@/components/system/ui";
import type { IsoMonth } from "@floc/core/dates/availability";
import { guestVoteIdea } from "@/app/invite/[token]/actions";
import type { GuestIdea } from "@/server/trips/guest-view";
import { GuestDates } from "./guest-dates";
import { GuestPanel } from "./guest-panel";
import { useGuestAnswer, type GuestAnswer } from "./use-guest-answer";

function GuestIdeas({ token, ideas, answer }: { token: string; ideas: GuestIdea[]; answer: GuestAnswer }) {
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

export function GuestAnswers({ token, ideas, mine, firstMonth, tripStart, tripEnd, signUpHref }: {
  token: string;
  ideas: GuestIdea[];
  mine: string[];
  firstMonth: IsoMonth;
  tripStart: string | null;
  tripEnd: string | null;
  signUpHref: string;
}) {
  const answer = useGuestAnswer();

  return (
    <div className={cx("grid gap-4", ideas.length > 0 && "lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start")}>
      {ideas.length > 0 ? (
        <GuestPanel title="Ideas" place="ideas" answer={answer} signUpHref={signUpHref}>
          <GuestIdeas token={token} ideas={ideas} answer={answer} />
        </GuestPanel>
      ) : null}
      <GuestDates
        token={token}
        mine={mine}
        firstMonth={firstMonth}
        trip={{ start: tripStart, end: tripEnd }}
        answer={answer}
        signUpHref={signUpHref}
      />
    </div>
  );
}
