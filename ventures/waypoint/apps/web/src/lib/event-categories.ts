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
  { label: string; tone: "marine" | "agreed" | "open"; row: string }
> = {
  transport: {
    label: "Transport",
    tone: "marine",
    /* `-edge` not `-soft`, so the blue card outlines like the green and yellow
       ones instead of dissolving into the sheet (ticket 73). */
    row: "border-pen-edge bg-pen-soft/40",
  },
  activity: {
    label: "Activity",
    tone: "agreed",
    row: "border-green-edge bg-green-soft/50",
  },
  food: {
    label: "Food",
    tone: "open",
    row: "border-highlight-edge bg-highlight-soft/60",
  },
};
