/**
 * Scoring for the Ideas board's "Most liked" order (ticket 36). Three
 * weights: heart is the strongest yes (worth two mild ones), thumbs-up a
 * quieter real yes, thumbs-down an objection carrying equal weight to
 * enthusiasm — one heart and one rather-not scores zero, not net-positive.
 */
import type { VoteValue } from "@/db/schema";

export const VOTE_WEIGHT: Record<VoteValue, number> = {
  up: 2,
  dont_mind: 1,
  down: -2,
};

/** A sum, not an average — an idea the whole group is keen on beats one a single person loved. */
export function voteScore(votes: { value: VoteValue }[]): number {
  return votes.reduce((total, v) => total + VOTE_WEIGHT[v.value], 0);
}
