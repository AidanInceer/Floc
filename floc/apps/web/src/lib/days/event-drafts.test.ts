import { describe, expect, it } from "vitest";

import { draftOfField, holdDraft, settleDraft, withDrafts, type HeldDrafts } from "./event-drafts";

const event = {
  id: 7,
  type: "food" as const,
  transportType: null,
  title: "Dinner in Alfama",
  time: "19:30",
  endTime: null,
  allDay: false,
  note: null,
  hasNote: false,
};

describe("withDrafts", () => {
  it("draws a held change over the server's row", () => {
    const held = holdDraft(new Map(), 7, { type: "activity" }, 1);
    expect(withDrafts([event], held)[0]).toMatchObject({ type: "activity", title: "Dinner in Alfama" });
  });

  it("leaves other events alone", () => {
    const other = { ...event, id: 8 };
    const held = holdDraft(new Map(), 7, { type: "activity" }, 1);
    expect(withDrafts([event, other], held)[1]).toBe(other);
  });

  it("returns the same list when nothing is held", () => {
    const events = [event];
    expect(withDrafts(events, new Map())).toBe(events);
  });
});

describe("holdDraft", () => {
  it("merges a second change into the first", () => {
    let held: HeldDrafts = holdDraft(new Map(), 7, { type: "activity" }, 1);
    held = holdDraft(held, 7, { allDay: true }, 2);
    expect(held.get(7)).toEqual({ draft: { type: "activity", allDay: true }, rev: 2 });
  });
});

describe("settleDraft", () => {
  it("drops the draft once the save that carried it lands", () => {
    const held = holdDraft(new Map(), 7, { type: "activity" }, 1);
    expect(settleDraft(held, 7, 1).has(7)).toBe(false);
  });

  it("keeps a change made while the save was in flight", () => {
    let held = holdDraft(new Map(), 7, { type: "activity" }, 1);
    held = holdDraft(held, 7, { type: "food" }, 2);
    expect(settleDraft(held, 7, 1)).toBe(held);
  });

  it("is a no-op for an event with nothing held", () => {
    const held: HeldDrafts = new Map();
    expect(settleDraft(held, 7, 1)).toBe(held);
  });
});

describe("draftOfField", () => {
  it("takes a name only when it has words", () => {
    expect(draftOfField("title", "Port tasting")).toEqual({ title: "Port tasting" });
    expect(draftOfField("title", "  ")).toBeNull();
  });

  it("takes a start time only once it is a whole clock time", () => {
    expect(draftOfField("time", "13:05")).toEqual({ time: "13:05" });
    expect(draftOfField("time", "")).toBeNull();
  });

  it("clears the end time when the field is emptied", () => {
    expect(draftOfField("endTime", "")).toEqual({ endTime: null });
    expect(draftOfField("endTime", "14:00")).toEqual({ endTime: "14:00" });
  });

  it("carries the note and whether there is one", () => {
    expect(draftOfField("note", "Book ahead")).toEqual({ note: "Book ahead", hasNote: true });
    expect(draftOfField("note", "")).toEqual({ note: null, hasNote: false });
  });

  it("ignores fields the block does not draw", () => {
    expect(draftOfField("placeName", "Porto")).toBeNull();
  });
});
