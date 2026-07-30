/**
 * What order a day's events appear in (ticket 74 follow-up).
 *
 * A day reads as a timeline, so **time decides the order** — an event moved to
 * 09:00 belongs above the 11:00 one, and nobody should have to drag it there
 * after editing the time. `order_index` survives, but demoted: it only breaks
 * ties, which in practice means it orders the **untimed** events among
 * themselves.
 *
 * Untimed events sort **last**, not first. "We haven't decided when" is the
 * loose end of a day, and a new one appends to the bottom of that tail rather
 * than jumping the queue — `addEvent` gives it the next `order_index`, which is
 * the highest, so it lands after the untimed events already there.
 *
 * Dragging then has to mean something that survives all of the above, because a
 * hand-dragged order would be silently overruled by the next time edit. So a
 * drag doesn't reorder the *events* — it permutes them through the day's
 * **slots**, exactly as dragging a day permutes the trip's dates
 * (`permuteDayContents`, CLAUDE.md rule 3). The sequence of times in a day
 * stays where it is and the events move between them. Dragging a timed event
 * into the untimed tail lands it in a slot with no time and clears it — the
 * same rule, not an exception.
 *
 * A drag has two possible meanings, and which one you get is which target you
 * drop on — an event, or the gap between two:
 *
 * - **Onto an event** → `swapItems`. The two trade places and therefore times;
 *   nothing between them moves.
 * - **Into a gap** → `insertAt`. The dragged event lands at that point and the
 *   run it passed over shifts one slot to close up behind it.
 *
 * The gaps are also how an event leaves its day: the same gap in another day's
 * list means "put it here". That one can't be a slot trade, because the target
 * list grows by one and there's nothing to trade with — so the event **keeps
 * its own time** and the target day re-sorts around it. A 04:00 ferry is still
 * the 04:00 ferry on Thursday; the drop point decides where it sits among the
 * untimed events, which is the part no clock is arguing about.
 */

/**
 * A drag within a day is a **swap**, not a lift-and-reinsert: drop A onto C in
 * `A B C D E` and you get `C B A D E`, with B untouched. The two rules go
 * together — if the times belong to the positions, then a drag trades one
 * position's contents for another's, and exactly two events are involved. A
 * lift-and-reinsert (`B C A D E`) would shuffle every time between the two
 * ends, which is a lot of the day rewritten for one drag.
 */
export function swapItems<T>(items: T[], a: number, b: number): T[] {
  if (a === b || a < 0 || b < 0 || a >= items.length || b >= items.length) {
    return items;
  }
  const next = items.slice();
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}

/**
 * Lift-and-reinsert, which is what a drag into a *different* day is: the list
 * grows, so there's nothing to swap with. `index` is clamped to the ends.
 */
export function insertAt<T>(items: T[], item: T, index: number): T[] {
  const next = items.filter((x) => x !== item);
  next.splice(Math.max(0, Math.min(index, next.length)), 0, item);
  return next;
}

/** The bits of an event that decide where it sits. */
export type EventSlot = {
  id: number;
  /** `HH:MM`. Null only when `allDay` — a start time is otherwise required. */
  time: string | null;
  /** `HH:MM`, optional — plenty of things end when they end. */
  endTime: string | null;
  allDay: boolean;
  orderIndex: number;
};

/** What a position in the day holds — traded whole when two events swap. */
type Slot = Pick<EventSlot, "time" | "endTime" | "allDay">;

const slotOf = (e: EventSlot): Slot => ({
  time: e.time,
  endTime: e.endTime,
  allDay: e.allDay,
});

/**
 * All-day covers the rows written before the flag existed too: a null start
 * time is what all-day *is*, so a legacy row is one, whatever its column says.
 */
const isAllDay = (e: EventSlot) => e.allDay || e.time === null;

/**
 * Sorts a day's events into the order they're shown in: by time, untimed last,
 * `order_index` breaking ties. Pure — the caller reads whatever the query gave
 * it and hands the rows through here.
 */
export function orderEvents<T extends EventSlot>(events: T[]): T[] {
  return events.slice().sort((a, b) => {
    const [aAll, bAll] = [isAllDay(a), isAllDay(b)];
    if (aAll !== bAll) return aAll ? 1 : -1;
    if (!aAll && a.time !== b.time) return a.time! < b.time! ? -1 : 1;
    return a.orderIndex - b.orderIndex;
  });
}

/**
 * The ids of every event that clashes with another — same start time, or
 * running hours that cross. Overlapping is allowed (two people can be doing
 * different things at 3pm) so this is a fact to show, never a rule to enforce.
 *
 * All-day events are left out. They cover the whole day by definition, so
 * flagging them against everything timed would mark the entire day and say
 * nothing. An event with no end time is a point in time, not a span, so it
 * clashes only with something running *through* it or starting at the same
 * moment — two things back to back (10:00–11:00 then 11:00) don't clash.
 */
export function findOverlaps(events: EventSlot[]): Set<number> {
  const timed = events.filter((e) => !isAllDay(e));
  const clashing = new Set<number>();

  for (let i = 0; i < timed.length; i++) {
    for (let j = i + 1; j < timed.length; j++) {
      const [a, b] = [timed[i], timed[j]];
      const aEnd = a.endTime ?? a.time!;
      const bEnd = b.endTime ?? b.time!;
      if (a.time === b.time || (aEnd > b.time! && bEnd > a.time!)) {
        clashing.add(a.id);
        clashing.add(b.id);
      }
    }
  }
  return clashing;
}

/**
 * Works out the writes behind a drag: `newOrder` is the event ids in the order
 * the user dropped them into, and the slots — the times, and the tie-breaking
 * indices — stay put while the events move between them.
 *
 * `events` must already be in display order (`orderEvents`). Returns one row
 * per event whose slot actually changed; an unchanged event is not written, so
 * a no-op drag costs nothing. A `newOrder` that isn't a permutation of the
 * day's live ids is ignored rather than half-applied — a partial one would
 * duplicate a time onto two events.
 */
export function permuteEventSlots(
  events: EventSlot[],
  newOrder: number[],
): (Slot & { id: number; orderIndex: number })[] {
  if (newOrder.length !== events.length) return [];

  const byId = new Map(events.map((e) => [e.id, e]));
  if (new Set(newOrder).size !== newOrder.length) return [];
  if (!newOrder.every((id) => byId.has(id))) return [];

  const writes: (Slot & { id: number; orderIndex: number })[] = [];
  newOrder.forEach((id, i) => {
    const event = byId.get(id)!;
    // The slot is the position's whole span — start, end and all-day together,
    // because half a trade would leave an event ending before it starts.
    // `order_index` re-bases to the position itself, which is what lets the
    // all-day tail hold a hand-picked order at all: it has no times to sort by.
    const slot = slotOf(events[i]);
    if (
      event.time === slot.time &&
      event.endTime === slot.endTime &&
      event.allDay === slot.allDay &&
      event.orderIndex === i
    ) {
      return;
    }
    writes.push({ id, ...slot, orderIndex: i });
  });
  return writes;
}
