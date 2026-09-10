/**
 * What order a day's events appear in (ticket 74 follow-up).
 *
 * Time decides the order; `order_index` only breaks ties among **untimed**
 * events, which sort **last** (the loose end of a day) — `addEvent` gives a
 * new one the highest index, so it lands after the untimed events already there.
 *
 * A drag can't reorder the *events* directly, or it'd be silently overruled by
 * the next time edit — instead it permutes them through the day's **slots**,
 * same as dragging a day permutes the trip's dates (`permuteDayContents`,
 * CLAUDE.md rule 3). Dropping a timed event into the untimed tail lands it in
 * a slot with no time and clears it — the same rule, not an exception.
 *
 * Drop target decides the meaning: onto an event → `swapItems` (the two trade
 * places, nothing between moves); into a gap → `insertAt` (lands at that
 * point, the run it passed over shifts one slot to close up). The cross-day
 * case is the gap case too, but with nothing to trade with — the event keeps
 * its own time and the target day re-sorts around it.
 */

/**
 * A drag within a day is a **swap**, not a lift-and-reinsert: drop A onto C in
 * `A B C D E` gives `C B A D E`, B untouched — a lift-and-reinsert would
 * shuffle every time between the two ends for one drag.
 */
export function swapItems<T>(items: T[], a: number, b: number): T[] {
  if (a === b || a < 0 || b < 0 || a >= items.length || b >= items.length) {
    return items;
  }
  const next = items.slice();
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}

/** Lift-and-reinsert — a drag into a *different* day, where there's nothing
 * to swap with. `index` is clamped to the ends. */
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

/** A null start time is what all-day *is* — covers legacy rows too. */
const isAllDay = (e: EventSlot) => e.allDay || e.time === null;

/** The narrowing `isAllDay` implies but cannot express: not all-day means there is a start time. */
const isTimed = <T extends EventSlot>(e: T): e is T & { time: string } => !isAllDay(e);

/** Sorts a day's events into display order: by time, untimed last, `order_index` breaking ties. */
export function orderEvents<T extends EventSlot>(events: T[]): T[] {
  return events.slice().sort((a, b) => {
    const aTimed = isTimed(a);
    const bTimed = isTimed(b);
    if (aTimed !== bTimed) return aTimed ? -1 : 1;
    if (aTimed && bTimed && a.time !== b.time) return a.time < b.time ? -1 : 1;
    return a.orderIndex - b.orderIndex;
  });
}

/**
 * The ids of every event that clashes with another — same start time, or
 * running hours that cross. A fact to show, never a rule to enforce (two
 * people can be doing different things at 3pm). All-day events are excluded
 * — flagging them against everything timed would mark the whole day. An
 * event with no end time clashes only with something running through it.
 */
export function findOverlaps(events: EventSlot[]): Set<number> {
  const timed = events.filter(isTimed);
  const clashing = new Set<number>();

  for (let i = 0; i < timed.length; i++) {
    for (let j = i + 1; j < timed.length; j++) {
      const [a, b] = [timed[i], timed[j]];
      const aEnd = a.endTime ?? a.time;
      const bEnd = b.endTime ?? b.time;
      if (a.time === b.time || (aEnd > b.time && bEnd > a.time)) {
        clashing.add(a.id);
        clashing.add(b.id);
      }
    }
  }
  return clashing;
}

/**
 * Works out the writes behind a drag: `newOrder` is the dropped-into event id
 * order; slots stay put while events move between them. `events` must already
 * be in display order (`orderEvents`). Returns only rows whose slot changed.
 * A `newOrder` that isn't a permutation of the day's live ids is ignored
 * rather than half-applied — a partial one would duplicate a time.
 */
export function permuteEventSlots(
  events: EventSlot[],
  newOrder: number[],
): (Slot & { id: number; orderIndex: number })[] {
  if (newOrder.length !== events.length) return [];

  const byId = new Map(events.map((e) => [e.id, e]));
  if (new Set(newOrder).size !== newOrder.length) return [];

  const ordered: EventSlot[] = [];
  for (const id of newOrder) {
    const event = byId.get(id);
    if (!event) return [];
    ordered.push(event);
  }

  const writes: (Slot & { id: number; orderIndex: number })[] = [];
  ordered.forEach((event, i) => {
    // Whole slot traded together — half a trade would leave an event ending
    // before it starts. `order_index` re-bases to the position, which is how
    // the all-day tail holds a hand-picked order despite having no times.
    const slot = slotOf(events[i]);
    if (
      event.time === slot.time &&
      event.endTime === slot.endTime &&
      event.allDay === slot.allDay &&
      event.orderIndex === i
    ) {
      return;
    }
    writes.push({ id: event.id, ...slot, orderIndex: i });
  });
  return writes;
}
