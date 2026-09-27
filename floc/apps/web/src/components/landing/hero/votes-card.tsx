import { Avatar, cx } from "@/components/system/ui";
import { heroPlaces, heroVotes, leader, tally, voteHeadline } from "@/lib/landing/hero/hero-votes";

import { Glyph } from "../landing-glyph";
import { sampleGroup } from "../sample-trip";
import { kicker, VOTED } from "./beats";
import { Roll } from "./swap";

/** Where to, vote by vote: each vote drops one block into its place's row. */
export function VotesCard({ step }: { step: number }) {
  const cast = Math.min(step, VOTED);
  const count = tally(cast);
  const lead = leader(count);
  const last = heroVotes[cast - 1];
  const voter = last && sampleGroup.find((p) => p.name === last.who);
  const headline = voteHeadline(cast);
  return (
    <div className="deck-card bg-pastel-yellow px-5 py-[18px] text-pastel-yellow-ink">
      <div className="flex items-center justify-between gap-2">
        <span className={kicker}>Where to</span>
        <span className="text-xs font-semibold">
          <Roll value={headline}>
            {cast === VOTED && <Glyph name="check" className="size-3" />}
            {headline}
          </Roll>
        </span>
      </div>
      <div className="mt-2.5 flex flex-col gap-2 text-[13px]">
        {heroPlaces.map((place) => (
          <div key={place} className={cx("deck-vote-row grid grid-cols-[4.4rem_1fr_1.2rem] items-center gap-2", lead === place && "font-semibold")}>
            <span>{place}</span>
            <span className="deck-vote-blocks grid grid-cols-6 gap-[3px]">
              {heroVotes.map((_, i) => (
                <i key={i} className={cx("deck-block", i < count[place] && "is-on")} />
              ))}
            </span>
            <span className="nums text-right">
              <Roll value={count[place]} />
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2.5 min-h-5 text-xs opacity-90">
        {last && voter && (
          <Roll value={last.who}>
            <Avatar name={voter.name} tone={voter.tone} size={16} />
            <b>{last.who}</b> voted {last.place}
          </Roll>
        )}
      </p>
    </div>
  );
}
