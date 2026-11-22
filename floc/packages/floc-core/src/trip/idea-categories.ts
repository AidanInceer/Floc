import type { DayEventType } from "../vocabulary";

export const ALL_IDEAS = "all";
export const IDEA_CATEGORY_MAX = 20;

export const IDEA_CATEGORIES = [
  { id: "travel", label: "Travel", event: "transport" },
  { id: "activities", label: "Activities", event: "activity" },
  { id: "food", label: "Food", event: "food" },
  { id: "drinks", label: "Drinks", event: "food" },
  { id: "other", label: "Other", event: "other" },
] as const satisfies readonly { id: string; label: string; event: DayEventType }[];

export type IdeaCategoryTab = { id: string; label: string; count: number };

const fold = (value: string) => value.toLowerCase();
const house = (value: string) =>
  IDEA_CATEGORIES.find((c) => fold(c.id) === fold(value) || fold(c.label) === fold(value));

export function readIdeaCategory(value: unknown): string {
  if (typeof value !== "string") return "other";
  const tidy = value.trim().replace(/\s+/g, " ").slice(0, IDEA_CATEGORY_MAX).trim();
  if (!tidy || fold(tidy) === ALL_IDEAS) return "other";
  return house(tidy)?.id ?? tidy;
}

export const ideaCategoryLabel = (category: string): string => house(category)?.label ?? category;

export const ideaEventType = (category: string): DayEventType => house(category)?.event ?? "other";

export function ideasIn<T extends { category: string }>(rows: readonly T[], tab: string): T[] {
  if (tab === ALL_IDEAS) return [...rows];
  return rows.filter((row) => fold(row.category) === fold(tab));
}

export function ideaCategoryTabs(rows: readonly { category: string }[], made: readonly string[] = []): IdeaCategoryTab[] {
  const own = new Map<string, string>();
  for (const name of [...rows.map((r) => r.category), ...made]) {
    if (!house(name) && !own.has(fold(name))) own.set(fold(name), name);
  }
  const named = [...own.values()].sort((a, b) => a.localeCompare(b));
  const tab = (id: string, label: string) => ({ id, label, count: ideasIn(rows, id).length });
  return [
    tab(ALL_IDEAS, "All"),
    ...IDEA_CATEGORIES.map((c) => tab(c.id, c.label)),
    ...named.map((name) => tab(name, name)),
  ];
}
