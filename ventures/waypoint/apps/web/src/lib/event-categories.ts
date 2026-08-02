import type { DayEventType } from "@/db/schema";

/**
 * How each event category reads on Days (ticket 68). One place, because the
 * badge, the row's tint and the picker's label all have to agree — three copies
 * of "food is the yellow one" is how they stop agreeing.
 *
 * Colour is never the only signal (CLAUDE.md): every row still carries its
 * category as a word in the badge. The tints are the existing highlighter
 * washes, one step apart, so a day reads as a sequence rather than a rainbow —
 * blue for movement (the pen, as everywhere else), green for a thing you're
 * doing, yellow for a thing you're eating.
 *
 * Its own module rather than part of `lib/itinerary.ts` because the event-type
 * picker is a client component (ticket 74) and `itinerary.ts` reaches the db,
 * which is `server-only` — importing it from the browser is a build error.
 */
export const EVENT_CATEGORIES: Record<
  DayEventType,
  {
    label: string;
    tone: "marine" | "agreed" | "open";
    row: string;
    /**
     * A block on the calendar grid (ticket 103). Fuller than `row`: on a time
     * grid a block is a small tinted rectangle read at a glance rather than a
     * full-width row with a badge on it, so the wash is undiluted, the ink is
     * the category's own, and the left edge is a thick stripe — the one part
     * still legible when an overlap has squeezed the block to a third of the
     * column. The word is still there in the block's own text and in the
     * detail panel's badge; colour is never the only signal.
     */
    block: string;
    /** The filter chip's swatch — the category's pen at full strength. */
    dot: string;
  }
> = {
  transport: {
    label: "Transport",
    tone: "marine",
    /* `-edge` not `-soft`, so the blue card outlines like the green and yellow
       ones instead of dissolving into the sheet (ticket 73). */
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
