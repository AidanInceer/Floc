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
  mine: boolean;
};

export function readIdeaSort(value: unknown): IdeaSort {
  return (IDEA_SORTS as readonly unknown[]).includes(value)
    ? (value as IdeaSort)
    : "votes";
}

export function sortIdeas(rows: readonly IdeaRow[], sort: IdeaSort): IdeaRow[] {
  const newest = (a: IdeaRow, b: IdeaRow) =>
    b.createdAt.getTime() - a.createdAt.getTime() || b.id - a.id;
  return [...rows].sort(
    sort === "newest" ? newest : (a, b) => b.votes - a.votes || newest(a, b),
  );
}

export function voteLabel(votes: number, mine: boolean): string {
  const count = votes === 1 ? "1 vote" : `${votes} votes`;
  return mine ? `${count}, yours included` : count;
}

export function ideasTucked({ days, today }: { days: readonly { overnightPlaceId: number | null }[]; today: boolean }): boolean {
  return today || days.some((d) => d.overnightPlaceId !== null);
}

export function steadyOrder(seen: readonly number[], now: readonly number[]): number[] {
  const live = new Set(now);
  const fresh = now.filter((id) => !seen.includes(id));
  return [...fresh, ...seen.filter((id) => live.has(id))];
}
