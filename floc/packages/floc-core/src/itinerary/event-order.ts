export function swapItems<T>(items: T[], a: number, b: number): T[] {
  if (a === b || a < 0 || b < 0 || a >= items.length || b >= items.length) {
    return items;
  }
  const next = items.slice();
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}

export function insertAt<T>(items: T[], item: T, index: number): T[] {
  const next = items.filter((x) => x !== item);
  next.splice(Math.max(0, Math.min(index, next.length)), 0, item);
  return next;
}

export type EventSlot = {
  id: number;
  time: string | null;
  endTime: string | null;
  allDay: boolean;
  orderIndex: number;
};

type Slot = Pick<EventSlot, "time" | "endTime" | "allDay">;

const slotOf = (e: EventSlot): Slot => ({
  time: e.time,
  endTime: e.endTime,
  allDay: e.allDay,
});

const isAllDay = (e: EventSlot) => e.allDay || e.time === null;

const isTimed = <T extends EventSlot>(e: T): e is T & { time: string } => !isAllDay(e);

export function orderEvents<T extends EventSlot>(events: T[]): T[] {
  return events.slice().sort((a, b) => {
    const aTimed = isTimed(a);
    const bTimed = isTimed(b);
    if (aTimed !== bTimed) return aTimed ? -1 : 1;
    if (aTimed && bTimed && a.time !== b.time) return a.time < b.time ? -1 : 1;
    return a.orderIndex - b.orderIndex;
  });
}

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
