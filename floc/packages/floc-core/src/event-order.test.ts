import { describe, expect, it } from "vitest";

import {
  findOverlaps,
  insertAt,
  orderEvents,
  permuteEventSlots,
  swapItems,
  type EventSlot,
} from "./event-order";

describe("swapItems", () => {
  it("swaps the two positions and leaves everything between them alone", () => {
    expect(swapItems(["A", "B", "C", "D", "E"], 0, 2)).toEqual([
      "C",
      "B",
      "A",
      "D",
      "E",
    ]);
  });

  it("is symmetric", () => {
    const items = ["A", "B", "C", "D", "E"];
    expect(swapItems(items, 2, 0)).toEqual(swapItems(items, 0, 2));
  });

  it("swapping adjacent positions is a one-step move", () => {
    expect(swapItems(["A", "B", "C"], 0, 1)).toEqual(["B", "A", "C"]);
  });

  it("returns the list unchanged for a no-op or an out-of-range index", () => {
    const items = ["A", "B"];
    expect(swapItems(items, 1, 1)).toEqual(items);
    expect(swapItems(items, 0, 5)).toEqual(items);
    expect(swapItems(items, -1, 0)).toEqual(items);
  });

  it("does not mutate the input", () => {
    const items = ["A", "B", "C"];
    swapItems(items, 0, 2);
    expect(items).toEqual(["A", "B", "C"]);
  });
});

describe("insertAt", () => {
  it("inserts at the given position", () => {
    expect(insertAt(["A", "B", "C"], "X", 1)).toEqual(["A", "X", "B", "C"]);
  });

  it("appends past the end and prepends below zero", () => {
    expect(insertAt(["A", "B"], "X", 99)).toEqual(["A", "B", "X"]);
    expect(insertAt(["A", "B"], "X", -3)).toEqual(["X", "A", "B"]);
  });

  it("moves rather than duplicates an item already in the list", () => {
    expect(insertAt(["A", "B", "C"], "A", 2)).toEqual(["B", "C", "A"]);
  });
});

function ev(id: number, time: string | null, orderIndex: number): EventSlot {
  return { id, time, endTime: null, allDay: time === null, orderIndex };
}

/** A timed event with an end, for the overlap cases. */
function span(id: number, time: string, endTime: string | null): EventSlot {
  return { id, time, endTime, allDay: false, orderIndex: id };
}

const ids = (events: EventSlot[]) => events.map((e) => e.id);

describe("orderEvents", () => {
  it("returns [] for an empty day", () => {
    expect(orderEvents([])).toEqual([]);
  });

  it("sorts by time regardless of order_index", () => {
    const events = [ev(1, "18:00", 0), ev(2, "09:30", 1), ev(3, "12:15", 2)];
    expect(ids(orderEvents(events))).toEqual([2, 3, 1]);
  });

  it("puts all-day events last, however early they were added", () => {
    const events = [ev(1, null, 0), ev(2, "09:30", 1)];
    expect(ids(orderEvents(events))).toEqual([2, 1]);
  });

  it("orders the all-day tail by order_index, so a new one appends", () => {
    const events = [ev(1, null, 0), ev(2, null, 1), ev(3, null, 2)];
    expect(ids(orderEvents(events))).toEqual([1, 2, 3]);
  });

  it("breaks a tie on the same time by order_index", () => {
    const events = [ev(1, "09:00", 5), ev(2, "09:00", 2)];
    expect(ids(orderEvents(events))).toEqual([2, 1]);
  });

  it("compares times as strings, which is why they're zero-padded HH:MM", () => {
    const events = [ev(1, "10:00", 0), ev(2, "09:00", 1)];
    expect(ids(orderEvents(events))).toEqual([2, 1]);
  });

  it("does not mutate the input", () => {
    const events = [ev(1, "18:00", 0), ev(2, "09:30", 1)];
    orderEvents(events);
    expect(ids(events)).toEqual([1, 2]);
  });
});

describe("permuteEventSlots", () => {
  it("swaps the times when two timed events swap places", () => {
    const events = [ev(1, "09:00", 0), ev(2, "14:00", 1)];
    expect(permuteEventSlots(events, [2, 1])).toEqual([
      { id: 2, time: "09:00", endTime: null, allDay: false, orderIndex: 0 },
      { id: 1, time: "14:00", endTime: null, allDay: false, orderIndex: 1 },
    ]);
  });

  it("writes nothing when the order is unchanged", () => {
    const events = [ev(1, "09:00", 0), ev(2, "14:00", 1)];
    expect(permuteEventSlots(events, [1, 2])).toEqual([]);
  });

  it("only writes the events whose slot actually moved", () => {
    const events = [ev(1, "09:00", 0), ev(2, "12:00", 1), ev(3, "14:00", 2)];
    const writes = permuteEventSlots(events, [1, 3, 2]);
    expect(writes.map((w) => w.id)).toEqual([3, 2]);
  });

  it("clears the time when a timed event is dragged into the all-day tail", () => {
    const events = [ev(1, "09:00", 0), ev(2, null, 1)];
    expect(permuteEventSlots(events, [2, 1])).toEqual([
      { id: 2, time: "09:00", endTime: null, allDay: false, orderIndex: 0 },
      { id: 1, time: null, endTime: null, allDay: true, orderIndex: 1 },
    ]);
  });

  it("reorders the all-day tail by rebasing order_index", () => {
    const events = [ev(1, null, 0), ev(2, null, 4), ev(3, null, 9)];
    expect(permuteEventSlots(events, [3, 1, 2])).toEqual([
      { id: 3, time: null, endTime: null, allDay: true, orderIndex: 0 },
      { id: 1, time: null, endTime: null, allDay: true, orderIndex: 1 },
      { id: 2, time: null, endTime: null, allDay: true, orderIndex: 2 },
    ]);
  });

  it("ignores an order that isn't the same length", () => {
    const events = [ev(1, "09:00", 0), ev(2, "14:00", 1)];
    expect(permuteEventSlots(events, [2])).toEqual([]);
  });

  it("ignores an order naming an event from another day", () => {
    const events = [ev(1, "09:00", 0), ev(2, "14:00", 1)];
    expect(permuteEventSlots(events, [1, 99])).toEqual([]);
  });

  it("ignores an order that repeats an id, which would clone a time", () => {
    const events = [ev(1, "09:00", 0), ev(2, "14:00", 1)];
    expect(permuteEventSlots(events, [1, 1])).toEqual([]);
  });

  it("round-trips: applying the writes then re-sorting gives the dropped order", () => {
    const events = [ev(1, "09:00", 0), ev(2, "12:00", 1), ev(3, null, 2)];
    const dropped = [3, 1, 2];
    const writes = new Map(permuteEventSlots(events, dropped).map((w) => [w.id, w]));
    const applied = events.map((e) => ({ ...e, ...(writes.get(e.id) ?? {}) }));
    expect(ids(orderEvents(applied))).toEqual(dropped);
  });
});

describe("findOverlaps", () => {
  it("finds nothing in an empty or single-event day", () => {
    expect([...findOverlaps([])]).toEqual([]);
    expect([...findOverlaps([span(1, "09:00", "10:00")])]).toEqual([]);
  });

  it("flags both sides of a crossing pair", () => {
    const events = [span(1, "09:00", "11:00"), span(2, "10:00", "12:00")];
    expect([...findOverlaps(events)].sort()).toEqual([1, 2]);
  });

  it("leaves back-to-back events alone", () => {
    const events = [span(1, "09:00", "10:00"), span(2, "10:00", "11:00")];
    expect([...findOverlaps(events)]).toEqual([]);
  });

  it("flags an event with no end that falls inside another's run", () => {
    const events = [span(1, "09:00", "11:00"), span(2, "10:00", null)];
    expect([...findOverlaps(events)].sort()).toEqual([1, 2]);
  });

  it("flags two events starting at the same time even with no ends", () => {
    const events = [span(1, "09:00", null), span(2, "09:00", null)];
    expect([...findOverlaps(events)].sort()).toEqual([1, 2]);
  });

  it("does not flag two endless events at different times", () => {
    const events = [span(1, "09:00", null), span(2, "10:00", null)];
    expect([...findOverlaps(events)]).toEqual([]);
  });

  it("ignores all-day events, which would otherwise flag the whole day", () => {
    const events = [ev(1, null, 0), span(2, "09:00", "10:00")];
    expect([...findOverlaps(events)]).toEqual([]);
  });

  it("flags every member of a three-way pile-up", () => {
    const events = [
      span(1, "09:00", "12:00"),
      span(2, "10:00", "11:00"),
      span(3, "11:30", "13:00"),
    ];
    expect([...findOverlaps(events)].sort()).toEqual([1, 2, 3]);
  });
});
