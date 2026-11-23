import type { AvatarIcon } from "../people/avatar-icon";

export type IdeaSort = "votes" | "newest";

export type IdeaRow = {
  id: number;
  title: string;
  category: string;
  createdAt: Date;
  authorId: string;
  authorName: string;
  authorAvatarIcon: AvatarIcon | null;
  votes: number;
  mine: boolean;
};

export const IDEA_TIMES: readonly { time: string | null; label: string }[] = [
  { time: null, label: "No time" },
  { time: "09:00", label: "Morning" },
  { time: "13:00", label: "Lunch" },
  { time: "15:00", label: "Afternoon" },
  { time: "19:30", label: "Dinner" },
  { time: "22:00", label: "Late" },
];

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

export function ideasStartOpen({
  startDate,
  endDate,
  days,
}: {
  startDate: string | null;
  endDate: string | null;
  days: readonly { overnightPlaceId: number | null }[];
}): boolean {
  return !(startDate && endDate && days.some((d) => d.overnightPlaceId !== null));
}

export function steadyOrder(seen: readonly number[], now: readonly number[]): number[] {
  const live = new Set(now);
  const fresh = now.filter((id) => !seen.includes(id));
  return [...fresh, ...seen.filter((id) => live.has(id))];
}
