import type { DayEventType } from "../vocabulary";

/**
 * How each event category reads on Days (ticket 68) — one place so the badge,
 * row tint, and picker label can't drift apart. Colour is never the only
 * signal: every row also carries the category as a word. Its own module, not
 * part of `server/itinerary/itinerary.ts`, because the picker is a client component
 * (ticket 74) and `itinerary.ts` is `server-only`.
 */
export const EVENT_CATEGORIES: Record<
  DayEventType,
  {
    label: string;
    tone: "marine" | "agreed" | "open" | "neutral";
    row: string;
    /** A block on the calendar grid (ticket 103) — undiluted wash, thick left-edge stripe, legible even squeezed thin by an overlap. */
    block: string;
    /** The filter chip's swatch — the category's pen at full strength. */
    dot: string;
    /** The small glyph tile beside an event on Overview and Explore. */
    tile: string;
  }
> = {
  transport: {
    label: "Transport",
    tone: "marine",
    // Blush is the route domain, and getting somewhere is the route (ticket
    // 203). It used to be blue; blue now means "yours to do" and nothing else.
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
  // Grey on purpose (2026-11-06): what is none of the three — keys, laundry,
  // a check-in — sits back so the coloured kinds still lead the eye.
  other: {
    label: "Other",
    tone: "neutral",
    row: "border-rule-strong bg-sheet-3/60",
    block: "border-rule-strong border-l-ink-soft bg-sheet-3 text-ink",
    dot: "bg-ink-faint",
    tile: "bg-sheet-3 text-ink",
  },
};
