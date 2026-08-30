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
    // Blush is the route domain, and getting somewhere is the route (ticket
    // 203). It used to be blue; blue now means "yours to do" and nothing else.
    row: "border-blush bg-blush/40",
    block: "border-blush border-l-blush-ink bg-blush text-blush-ink",
    dot: "bg-blush-ink",
  },
  activity: {
    label: "Activity",
    tone: "agreed",
    row: "border-peri bg-peri/40",
    block: "border-peri border-l-peri-ink bg-peri text-peri-ink",
    dot: "bg-peri-ink",
  },
  food: {
    label: "Food",
    tone: "open",
    row: "border-butter bg-butter/50",
    block: "border-butter border-l-butter-ink bg-butter text-butter-ink",
    dot: "bg-butter-ink",
  },
};
