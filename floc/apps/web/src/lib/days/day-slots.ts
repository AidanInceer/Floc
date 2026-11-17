export type SlotOnly = "wide" | "narrow";

export type SlotIndex = { index: number; only?: SlotOnly };

export function mergeSlots(week: number[], narrow: number[]): SlotIndex[] {
  const inWeek = new Set(week);
  const inNarrow = new Set(narrow);
  return [...new Set([...week, ...narrow])]
    .sort((a, b) => a - b)
    .map((index) => {
      if (!inNarrow.has(index)) return { index, only: "wide" as const };
      if (!inWeek.has(index)) return { index, only: "narrow" as const };
      return { index };
    });
}
