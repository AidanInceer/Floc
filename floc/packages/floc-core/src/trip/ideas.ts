/**
 * Ideas — the loose, pre-dates half of planning. One vote each, no thread.
 *
 * Why: ordering is here rather than in SQL because both orders are read off
 * the same loaded page — a view choice a person flips, not a query.
 */

import type { AvatarIcon } from "../people/avatar-icon";

export const IDEA_SORTS = ["votes", "newest"] as const;
export type IdeaSort = (typeof IDEA_SORTS)[number];

export type IdeaRow = {
  id: number;
  title: string;
  createdAt: Date;
  authorId: string;
  authorName: string;
  authorAvatarIcon: AvatarIcon | null;
  votes: number;
  /** Whether the person reading has voted for it. */
  mine: boolean;
};

export function readIdeaSort(value: unknown): IdeaSort {
  return (IDEA_SORTS as readonly unknown[]).includes(value)
    ? (value as IdeaSort)
    : "votes";
}

/**
 * Newest first breaks a tie on votes, so two level ideas never swap places
 * between two renders of the same page.
 */
export function sortIdeas(rows: readonly IdeaRow[], sort: IdeaSort): IdeaRow[] {
  const newest = (a: IdeaRow, b: IdeaRow) => b.id - a.id;
  return [...rows].sort(
    sort === "newest" ? newest : (a, b) => b.votes - a.votes || newest(a, b),
  );
}

/** The tally as words, because a bare number beside an arrow says nothing on its own. */
export function voteLabel(votes: number, mine: boolean): string {
  const count = votes === 1 ? "1 vote" : `${votes} votes`;
  return mine ? `${count}, yours included` : count;
}
