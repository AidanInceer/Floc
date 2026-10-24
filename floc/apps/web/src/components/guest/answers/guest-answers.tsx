"use client";

import { cx } from "@/components/system/ui";
import type { IsoMonth } from "@floc/core/dates/availability";
import type { GuestIdea } from "@/server/trips/guest-view";
import { GuestDates } from "./guest-dates";
import { GuestIdeas } from "./guest-ideas";
import { GuestPanel } from "./guest-panel";
import { useGuestAnswer } from "./use-guest-answer";

/** What somebody on a share link may answer with a name (#442, ADR-029): the ideas and their own days. Nothing else. */
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
