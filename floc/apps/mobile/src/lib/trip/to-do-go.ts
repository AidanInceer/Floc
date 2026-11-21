import type { Gap, GapTab, ToDoInput } from "@floc/core/trip/overview/to-do";

export type OverviewSection = "ideas";

export type ToDoGo = { section: OverviewSection } | { tab: Exclude<GapTab, "overview"> };

export function toDoGo(gap: Pick<Gap, "tab" | "anchor">): ToDoGo {
  if (gap.tab !== "overview") return { tab: gap.tab };
  return { section: "ideas" };
}

export function bagOf(mine: { packed: boolean }[]): NonNullable<ToDoInput["bag"]> {
  return { total: mine.length, packed: mine.filter((l) => l.packed).length };
}
