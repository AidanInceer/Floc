/**
 * Scoring for the Ideas board's "Most liked" order.
 *
 * The vote used to be read as two tiers — a keen counted for, a rather-not
 * against, and a don't-mind was thrown away. Once the control became
 * heart / thumbs-up / thumbs-down (ticket 36) that was visibly wrong: a
 * thumbs-up is a yes, so an idea three people are fine with must outrank one
 * nobody has said anything about, and must still sit below one somebody loves.
 *
 * So three weights, in the order the buttons appear:
 *
 * - heart (`up`) — the strongest yes, worth two mild ones.
 * - thumbs-up (`dont_mind`) — a real yes, just a quiet one.
 * - thumbs-down (`down`) — an objection, and objections carry as much weight as
 *   enthusiasm: one heart and one rather-not is a group that hasn't agreed on
 *   anything, and scores zero rather than net-positive.
 */
import type { VoteValue } from "@/db/schema";

export const VOTE_WEIGHT: Record<VoteValue, number> = {
  up: 2,
  dont_mind: 1,
  down: -2,
};

/**
 * Weighted total for one idea. A sum, not an average, so an idea the whole
 * group is keen on beats one that a single person loved — the board is looking
 * for what to do next, and that takes numbers behind it.
 */
export function voteScore(votes: { value: VoteValue }[]): number {
  return votes.reduce((total, v) => total + VOTE_WEIGHT[v.value], 0);
}
