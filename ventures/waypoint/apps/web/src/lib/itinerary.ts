/**
 * Reordering the itinerary — the one primitive behind "drag Lisbon above
 * Peniche" on Route and "drag this day earlier" on Days.
 *
 * The itinerary is day-first and a stop is derived, never stored (CLAUDE.md
 * rule 3), so there is no `order_index` to bump and nothing stored to drag.
 * What actually moves is a day's *contents* — its overnight place and its
 * events — between the day rows, whose dates stay exactly where they are. Ten
 * days of a trip stay the same ten dates; only what happens on them is
 * permuted. That is also why a stop's dates change when it moves: a two-night
 * stop dropped in front of a three-night one takes the first two dates of the
 * pair's combined span.
 *
 * What deliberately does NOT travel with a day:
 *
 * - **Expenses.** `expense.day_id` points at a date, and money was spent on the
 *   day it was spent on. Moving the plan doesn't rewrite the receipts.
 * - **Comments.** Threads hang off `day_event` (scope + scope_id), and the
 *   events keep their ids as they move, so every thread arrives with its event
 *   without this module touching the `note` table at all.
 *
 * Last-write-wins (rule 7): two people dragging at once means the second write
 * lands on whatever the first left behind. No locking, no rejection.
 */
import { and, asc, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/db";
import { day, dayEvent, type DayEventType } from "@/db/schema";
import { touch } from "@/lib/unlocks";

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
 */
export const EVENT_CATEGORIES: Record<
  DayEventType,
  { label: string; tone: "marine" | "agreed" | "open"; row: string }
> = {
  transport: {
    label: "Transport",
    tone: "marine",
    row: "border-pen-soft bg-pen-soft/40",
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

/** Moves one item within an array, returning a new array. */
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return items;
  }
  const next = items.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/**
 * Rewrites the trip's itinerary so that the day identified by `newOrder[i]`
 * ends up on the date currently held by the i-th day.
 *
 * `newOrder` must be a permutation of the trip's live day ids — anything else
 * is ignored rather than half-applied, since a partial permutation would
 * duplicate an event onto two dates.
 */
export async function permuteDayContents(tripId: number, newOrder: number[]) {
  const days = await db
    .select({ id: day.id, date: day.date, overnightPlaceId: day.overnightPlaceId })
    .from(day)
    .where(and(eq(day.tripId, tripId), isNull(day.deletedAt)))
    .orderBy(asc(day.date))
    .all();

  if (newOrder.length !== days.length) return;
  const source = new Map(days.map((d) => [d.id, d]));
  if (new Set(newOrder).size !== newOrder.length) return;
  if (newOrder.some((id) => !source.has(id))) return;

  // Everything is read BEFORE anything is written: the loops below write into
  // the same rows they would otherwise be reading from, so a snapshot is what
  // keeps this a permutation rather than a cascade.
  const events = await db
    .select({ id: dayEvent.id, dayId: dayEvent.dayId })
    .from(dayEvent)
    .where(
      and(
        inArray(dayEvent.dayId, days.map((d) => d.id)),
        isNull(dayEvent.deletedAt),
      ),
    )
    .all();

  const eventsByDay = new Map<number, number[]>();
  for (const e of events) {
    const list = eventsByDay.get(e.dayId);
    if (list) list.push(e.id);
    else eventsByDay.set(e.dayId, [e.id]);
  }

  // The writes are issued together rather than awaited one at a time: because
  // `newOrder` is a verified permutation of live day ids, every statement below
  // touches a distinct day row and a distinct set of event rows, so nothing
  // here can race anything else here. Awaiting each in turn cost up to 2N
  // serial round trips on a single drag.
  const writes: Promise<unknown>[] = [];

  for (const [i, target] of days.entries()) {
    const from = source.get(newOrder[i])!;
    if (from.id === target.id) continue;

    writes.push(
      db
        .update(day)
        .set({ overnightPlaceId: from.overnightPlaceId, ...touch() })
        .where(eq(day.id, target.id)),
    );

    const moving = eventsByDay.get(from.id);
    if (moving?.length) {
      writes.push(
        db
          .update(dayEvent)
          .set({ dayId: target.id, ...touch() })
          .where(inArray(dayEvent.id, moving)),
      );
    }
  }

  await Promise.all(writes);
}
