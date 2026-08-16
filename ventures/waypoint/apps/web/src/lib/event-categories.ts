import type { DayEventType } from "@/db/schema";

/**
 * How each event category reads on Days (ticket 68) — one place so the badge,
 * row tint, and picker label can't drift apart. Colour is never the only
 * signal: every row also carries the category as a word. Its own module, not
 * part of `lib/itinerary.ts`, because the picker is a client component
 * (ticket 74) and `itinerary.ts` is `server-only`.
 */
export const EVENT_CATEGORIES: Record<
  DayEventType,
  {
    label: string;
    tone: "marine" | "agreed" | "open";
    row: string;
    /** A block on the calendar grid (ticket 103) — undiluted wash, thick left-edge stripe, legible even squeezed thin by an overlap. */
    block: string;
    /** The filter chip's swatch — the category's pen at full strength. */
    dot: string;
  }
> = {
  transport: {
    label: "Transport",
    tone: "marine",
    // `-edge` not `-soft`, so blue outlines like green/yellow instead of dissolving into the sheet (ticket 73).
    row: "border-pen-edge bg-pen-soft/40",
    block: "border-pen-edge border-l-pen bg-pen-soft text-pen",
    dot: "bg-pen",
  },
  activity: {
    label: "Activity",
    tone: "agreed",
    row: "border-green-edge bg-green-soft/50",
    block: "border-green-edge border-l-green bg-green-soft text-green",
    dot: "bg-green",
  },
  food: {
    label: "Food",
    tone: "open",
    row: "border-highlight-edge bg-highlight-soft/60",
    block:
      "border-highlight-edge border-l-highlight bg-highlight-soft text-highlight-ink",
    dot: "bg-highlight",
  },
};
