import type { DayEventType } from "../vocabulary";

export const EVENT_CATEGORIES: Record<
  DayEventType,
  {
    label: string;
    tone: "marine" | "agreed" | "open" | "neutral";
    row: string;
    block: string;
    dot: string;
    tile: string;
  }
> = {
  transport: {
    label: "Transport",
    tone: "marine",
    row: "border-pastel-red bg-pastel-red/40",
    block: "border-pastel-red border-l-pastel-red-ink bg-pastel-red text-pastel-red-ink",
    dot: "bg-pastel-red-ink",
    tile: "bg-pastel-red text-pastel-red-ink",
  },
  activity: {
    label: "Activity",
    tone: "agreed",
    row: "border-pastel-blue bg-pastel-blue/40",
    block: "border-pastel-blue border-l-pastel-blue-ink bg-pastel-blue text-pastel-blue-ink",
    dot: "bg-pastel-blue-ink",
    tile: "bg-pastel-blue text-pastel-blue-ink",
  },
  food: {
    label: "Food",
    tone: "open",
    row: "border-pastel-yellow bg-pastel-yellow/50",
    block: "border-pastel-yellow border-l-pastel-yellow-ink bg-pastel-yellow text-pastel-yellow-ink",
    dot: "bg-pastel-yellow-ink",
    tile: "bg-pastel-yellow text-pastel-yellow-ink",
  },
  other: {
    label: "Other",
    tone: "neutral",
    row: "border-rule-strong bg-sheet-3/60",
    block: "border-rule-strong border-l-ink-soft bg-sheet-3 text-ink",
    dot: "bg-ink-faint",
    tile: "bg-sheet-3 text-ink",
  },
};
