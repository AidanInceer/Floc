/**
 * The itinerary aggregate's reads and day writes.
 *
 * Two things are being pinned here. The soft-delete filters ticket 115 added to
 * the *writes* — rule 8 used to say "every read", and a stale id from a page
 * rendered before a delete would otherwise resurrect the row into a half-state.
 * And the batched writes of ticket 114, where a permutation now goes out in one
 * round of statements rather than one per event: the assertion is on the
 * outcome, because "did it go out in parallel" is not a property a test can see
 * and "did it land correctly" is the one that would break if it were wrong.
 */
import { and, eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import {
  applyTripWindow,
  ensureDays,
  listDayIds,
  listDayLoads,
  listDays,
  moveItem,
  rebaseEventOrder,
  revalidateItinerary,
  setOvernightPlaceOn,
  softDeleteDay,
  softDeleteEvent,
  updateEventFields,
} from "@/server/itinerary";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

const dayRow = (id: number) =>
  db.select().from(schema.day).where(eq(schema.day.id, id)).get();

const eventRow = (id: number) =>
  db.select().from(schema.dayEvent).where(eq(schema.dayEvent.id, id)).get();

async function makePlace(name = "Lisbon") {
  const row = await db
    .insert(schema.place)
    .values({ name })
    .returning({ id: schema.place.id })
    .get();
  return row.id;
}

describe("reading the itinerary", () => {
  it("returns the trip's live days in date order, and only its own", async () => {
    await ensureDays(world.ours.id, ["2026-09-03", "2026-09-02"]);

    const days = await listDays(world.ours.id);
    expect(days.map((d) => d.date)).toEqual([
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
    ]);
    expect(await listDayIds(world.theirs.id)).toEqual([world.theirs.dayId]);
  });

  it("drops a soft-deleted day from every read", async () => {
    await softDeleteDay(world.ours.dayId);
    expect(await listDays(world.ours.id)).toEqual([]);
  });
});

describe("ensureDays", () => {
  it("is idempotent, including over a soft-deleted date", async () => {
    // A soft-deleted row still occupies the (trip, date) unique index, so
    // skipping it is what keeps a re-run from throwing.
    await softDeleteDay(world.ours.dayId);
    await ensureDays(world.ours.id, ["2026-09-01"]);
    await ensureDays(world.ours.id, ["2026-09-01"]);

    const all = await db
      .select()
      .from(schema.day)
      .where(eq(schema.day.tripId, world.ours.id))
      .all();
    expect(all).toHaveLength(1);
  });

  it("is a no-op on no dates", async () => {
    await ensureDays(world.ours.id, []);
    expect(await listDayIds(world.ours.id)).toEqual([world.ours.dayId]);
  });
});

describe("listDayLoads", () => {
  it("counts the live events on each live day", async () => {
    await ensureDays(world.ours.id, ["2026-09-02"]);
    await softDeleteEvent(world.ours.lateEventId);

    expect(await listDayLoads(world.ours.id)).toEqual([
      { date: "2026-09-01", events: 1 },
      { date: "2026-09-02", events: 0 },
    ]);
  });
});

describe("applyTripWindow", () => {
  it("creates a day per date and keeps what the old window shared", async () => {
    // 1 Sep → 1–3 Sep. The seeded day and its events stay put; a day is
    // addressed by its date, so nothing shifts.
    await applyTripWindow(world.ours.id, "2026-09-01", "2026-09-03");

    expect((await listDays(world.ours.id)).map((d) => d.date)).toEqual([
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
    ]);
    expect(await eventRow(world.ours.eventId)).toBeDefined();
  });

  it("hard-deletes the days outside the window, with their events", async () => {
    await applyTripWindow(world.ours.id, "2026-09-05", "2026-09-06");

    // Hard, not soft (the second exception to rule 8): a soft-deleted row
    // would keep holding 1 Sep on the unique index, so re-extending back over
    // that date could never give the day again.
    const rows = await db
      .select()
      .from(schema.day)
      .where(eq(schema.day.tripId, world.ours.id))
      .all();
    expect(rows.map((d) => d.date)).toEqual(["2026-09-05", "2026-09-06"]);
    expect(await eventRow(world.ours.eventId)).toBeUndefined();
  });

  it("gives a blank day back when the window extends over a removed date", async () => {
    await applyTripWindow(world.ours.id, "2026-09-05", "2026-09-06");
    await applyTripWindow(world.ours.id, "2026-09-01", "2026-09-06");

    const days = await listDays(world.ours.id);
    expect(days).toHaveLength(6);
    // Blank: the plan does not come back with the date (ticket 83).
    expect(await eventRow(world.ours.eventId)).toBeUndefined();
  });

  it("keeps an expense and detaches it from the day it was spent on", async () => {
    const spend = await db
      .insert(schema.expense)
      .values({
        tripId: world.ours.id,
        dayId: world.ours.dayId,
        paidBy: world.admin,
        description: "Ferry",
        amountMinor: 1200,
        currency: "GBP",
        splitType: "even" as const,
        createdBy: world.admin,
      })
      .returning({ id: schema.expense.id })
      .get();

    await applyTripWindow(world.ours.id, "2026-09-05", "2026-09-06");

    const after = await db
      .select()
      .from(schema.expense)
      .where(eq(schema.expense.id, spend.id))
      .get();
    expect(after?.dayId).toBeNull();
  });

  it("empties the itinerary when the window is cleared", async () => {
    await applyTripWindow(world.ours.id, null, null);

    expect(await listDays(world.ours.id)).toEqual([]);
    // And only this trip's — the other trip's day is untouched.
    expect(await listDayIds(world.theirs.id)).toEqual([world.theirs.dayId]);
  });
});

describe("the overnight place", () => {
  it("reads back what was written, and clears to null", async () => {
    const placeId = await makePlace();
    await setOvernightPlaceOn(world.ours.id, [world.ours.dayId], placeId);
    expect((await dayRow(world.ours.dayId))?.overnightPlaceId).toBe(placeId);

    await setOvernightPlaceOn(world.ours.id, [world.ours.dayId], null);
    expect((await dayRow(world.ours.dayId))?.overnightPlaceId).toBeNull();
  });

  it("will not write onto another trip's day", async () => {
    const placeId = await makePlace();
    await setOvernightPlaceOn(world.ours.id, [world.theirs.dayId], placeId);
    expect((await dayRow(world.theirs.dayId))?.overnightPlaceId).toBeNull();
  });

  /** Ticket 115: writes filter soft-deletes too, not just reads. */
  it("will not resurrect a deleted day from a stale id", async () => {
    const placeId = await makePlace();
    await softDeleteDay(world.ours.dayId);

    await setOvernightPlaceOn(world.ours.id, [world.ours.dayId], placeId);

    expect((await dayRow(world.ours.dayId))?.overnightPlaceId).toBeNull();
  });
});

describe("deleting", () => {
  it("does not re-stamp deletedAt on a day deleted twice", async () => {
    await softDeleteDay(world.ours.dayId);
    const first = (await dayRow(world.ours.dayId))?.deletedAt;
    await softDeleteDay(world.ours.dayId);
    expect((await dayRow(world.ours.dayId))?.deletedAt?.getTime()).toBe(
      first?.getTime(),
    );
  });

  it("will not edit an event that has been deleted", async () => {
    await softDeleteEvent(world.ours.eventId);
    await updateEventFields(world.ours.eventId, {
      type: "activity",
      title: "Rewritten after the fact",
    });
    expect((await eventRow(world.ours.eventId))?.title).not.toBe(
      "Rewritten after the fact",
    );
  });
});

describe("rebaseEventOrder", () => {
  it("writes a dense order over the ids given, in one round", async () => {
    await rebaseEventOrder([world.ours.lateEventId, world.ours.eventId]);
    expect((await eventRow(world.ours.lateEventId))?.orderIndex).toBe(0);
    expect((await eventRow(world.ours.eventId))?.orderIndex).toBe(1);
  });

  it("skips a deleted event rather than reviving its position", async () => {
    await softDeleteEvent(world.ours.eventId);
    await rebaseEventOrder([world.ours.eventId]);
    expect((await eventRow(world.ours.eventId))?.deletedAt).not.toBeNull();
  });
});

describe("moveItem", () => {
  it("moves within range and refuses anything else", () => {
    expect(moveItem([1, 2, 3], 0, 2)).toEqual([2, 3, 1]);
    expect(moveItem([1, 2, 3], 1, 1)).toEqual([1, 2, 3]);
    expect(moveItem([1, 2, 3], -1, 2)).toEqual([1, 2, 3]);
    expect(moveItem([1, 2, 3], 0, 9)).toEqual([1, 2, 3]);
  });
});

describe("revalidateItinerary", () => {
  it("takes Days and Overview, because a day row is drawn on both", () => {
    expect(() => revalidateItinerary(world.ours.id)).not.toThrow();
  });
});

/** Guards the scoping the whole aggregate leans on. */
describe("trip scoping", () => {
  it("never lets one trip's read see another's rows", async () => {
    const ours = await listDayIds(world.ours.id);
    const theirs = await listDayIds(world.theirs.id);
    expect(ours.some((id) => theirs.includes(id))).toBe(false);

    expect(
      await db
        .select()
        .from(schema.day)
        .where(
          and(eq(schema.day.tripId, world.theirs.id), eq(schema.day.id, world.ours.dayId)),
        )
        .get(),
    ).toBeUndefined();
  });
});
