import { and, eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import {
  setTripWindow,
  extendTripDays,
  ensureDays,
  listDayIds,
  listDayLoads,
  listDays,
  moveItem,
  rebaseEventOrder,
  setOvernightPlaceOn,
  softDeleteDay,
  softDeleteEvent,
  updateEventFields,
} from "@/server/itinerary/itinerary";

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
    await softDeleteDay(world.ours.dayId, world.admin);
    expect(await listDays(world.ours.id)).toEqual([]);
  });
});

describe("ensureDays", () => {
  it("is idempotent, including over a soft-deleted date", async () => {
    await softDeleteDay(world.ours.dayId, world.admin);
    await ensureDays(world.ours.id, ["2026-09-01"]);
    await ensureDays(world.ours.id, ["2026-09-01"]);

    const all = await db
      .select()
      .from(schema.day)
      .where(eq(schema.day.tripId, world.ours.id))
      .all();
    expect(all).toHaveLength(1);
  });

  it("brings a removed day back, blank", async () => {
    await softDeleteDay(world.ours.dayId, world.admin);

    await ensureDays(world.ours.id, ["2026-09-01"]);

    const days = await listDays(world.ours.id);
    expect(days.map((d) => d.date)).toEqual(["2026-09-01"]);
    expect((await listDayLoads(world.ours.id))[0].events).toBe(0);
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

describe("setTripWindow", () => {
  it("creates a day per date and keeps what the old window shared", async () => {
    await setTripWindow(world.ours.id, "2026-09-01", "2026-09-03", world.admin);

    expect((await listDays(world.ours.id)).map((d) => d.date)).toEqual([
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
    ]);
    expect(await eventRow(world.ours.eventId)).toBeDefined();
  });

  it("soft-deletes the days outside the window, with their events (rule 8)", async () => {
    await setTripWindow(world.ours.id, "2026-09-05", "2026-09-06", world.admin);

    expect((await listDays(world.ours.id)).map((d) => d.date)).toEqual(["2026-09-05", "2026-09-06"]);
    expect((await dayRow(world.ours.dayId))?.deletedAt).not.toBeNull();
    expect((await eventRow(world.ours.eventId))?.deletedAt).not.toBeNull();
  });

  it("gives a blank day back when the window extends over a removed date", async () => {
    await setTripWindow(world.ours.id, "2026-09-05", "2026-09-06", world.admin);
    await setTripWindow(world.ours.id, "2026-09-01", "2026-09-06", world.admin);

    const days = await listDays(world.ours.id);
    expect(days).toHaveLength(6);
    expect((await eventRow(world.ours.eventId))?.deletedAt).not.toBeNull();
    expect((await listDayLoads(world.ours.id)).every((d) => d.events === 0)).toBe(true);
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

    await setTripWindow(world.ours.id, "2026-09-05", "2026-09-06", world.admin);

    const after = await db
      .select()
      .from(schema.expense)
      .where(eq(schema.expense.id, spend.id))
      .get();
    expect(after?.dayId).toBeNull();
  });

  it("saves new dates in one trip to the database (rule 2)", async () => {
    const interactive = vi.spyOn(db, "transaction");
    const batch = vi.spyOn(db, "batch");

    await setTripWindow(world.ours.id, "2026-09-05", "2026-09-06", world.admin);

    expect(interactive).not.toHaveBeenCalled();
    expect(batch).toHaveBeenCalledTimes(1);
    interactive.mockRestore();
    batch.mockRestore();
  });

  it("leaves the trip, days and events whole when a date save fails (rule 2)", async () => {
    const before = await db.select().from(schema.trip).where(eq(schema.trip.id, world.ours.id)).get();

    await expect(setTripWindow(world.ours.id, "2026-09-05", "2026-09-06", "nobody")).rejects.toThrow();

    const after = await db.select().from(schema.trip).where(eq(schema.trip.id, world.ours.id)).get();
    expect(after?.startDate).toBe(before?.startDate);
    expect(after?.endDate).toBe(before?.endDate);
    expect((await listDays(world.ours.id)).map((d) => d.date)).toEqual(["2026-09-01"]);
    expect((await eventRow(world.ours.eventId))?.deletedAt).toBeNull();
  });

  it("folds rapid date saves into one activity and one notice each", async () => {
    await setTripWindow(world.ours.id, "2026-09-05", "2026-09-06", world.admin);
    await setTripWindow(world.ours.id, "2026-09-07", "2026-09-08", world.admin);

    const changed = await db
      .select()
      .from(schema.activity)
      .where(and(eq(schema.activity.kind, "trip_dates_changed"), eq(schema.activity.tripId, world.ours.id)))
      .all();
    expect(changed).toHaveLength(1);
    expect(changed[0].subjectId).toBeNull();
    const notices = await db
      .select()
      .from(schema.notification)
      .where(and(eq(schema.notification.activityId, changed[0].id), eq(schema.notification.userId, world.member)))
      .all();
    expect(notices).toHaveLength(1);
  });

  it("clears file links to a removed day and its events, and keeps the files", async () => {
    const file = (name: string, link: { dayId?: number; dayEventId?: number }) =>
      db
        .insert(schema.document)
        .values({
          tripId: world.ours.id,
          uploadedBy: world.admin,
          name,
          storageKey: `test/${name}`,
          mimeType: "application/pdf",
          sizeBytes: 10,
          ...link,
        })
        .returning({ id: schema.document.id })
        .get();
    const onDay = await file("day.pdf", { dayId: world.ours.dayId });
    const onEvent = await file("event.pdf", { dayEventId: world.ours.eventId });

    await setTripWindow(world.ours.id, "2026-09-05", "2026-09-06", world.admin);

    const read = (id: number) => db.select().from(schema.document).where(eq(schema.document.id, id)).get();
    expect((await read(onDay.id))?.dayId).toBeNull();
    expect((await read(onEvent.id))?.dayEventId).toBeNull();
    expect((await read(onEvent.id))?.deletedAt).toBeNull();
  });

  it("brings a removed date back with no overnight place", async () => {
    const placeId = await makePlace();
    await setOvernightPlaceOn(world.ours.id, [world.ours.dayId], placeId);

    await setTripWindow(world.ours.id, "2026-09-05", "2026-09-06", world.admin);
    await setTripWindow(world.ours.id, "2026-09-01", "2026-09-06", world.admin);

    const back = await dayRow(world.ours.dayId);
    expect(back?.deletedAt).toBeNull();
    expect(back?.overnightPlaceId).toBeNull();
  });

  it("leaves another trip's days and events alone", async () => {
    await setTripWindow(world.ours.id, "2026-09-05", "2026-09-06", world.admin);

    expect(await listDayIds(world.theirs.id)).toEqual([world.theirs.dayId]);
  });

  it("empties the itinerary when the window is cleared", async () => {
    await setTripWindow(world.ours.id, null, null, world.admin);

    expect(await listDays(world.ours.id)).toEqual([]);
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

  it("will not resurrect a deleted day from a stale id", async () => {
    const placeId = await makePlace();
    await softDeleteDay(world.ours.dayId, world.admin);

    await setOvernightPlaceOn(world.ours.id, [world.ours.dayId], placeId);

    expect((await dayRow(world.ours.dayId))?.overnightPlaceId).toBeNull();
  });
});

describe("deleting", () => {
  it("does not re-stamp deletedAt on a day deleted twice", async () => {
    await softDeleteDay(world.ours.dayId, world.admin);
    const first = (await dayRow(world.ours.dayId))?.deletedAt;
    await softDeleteDay(world.ours.dayId, world.admin);
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

describe("extendTripDays", () => {
  async function windowOf(tripId: number) {
    return db
      .select({ startDate: schema.trip.startDate, endDate: schema.trip.endDate })
      .from(schema.trip)
      .where(eq(schema.trip.id, tripId))
      .get();
  }

  it("adds days in one trip to the database (rule 2)", async () => {
    const trip = { id: world.ours.id, startDate: "2026-09-01", endDate: "2026-09-01" };
    await db.update(schema.trip).set({ startDate: trip.startDate, endDate: trip.endDate }).where(eq(schema.trip.id, trip.id));
    const interactive = vi.spyOn(db, "transaction");
    const batch = vi.spyOn(db, "batch");

    await extendTripDays(trip, "2026-09-01", 2, world.admin);

    expect(interactive).not.toHaveBeenCalled();
    expect(batch).toHaveBeenCalledTimes(1);
    interactive.mockRestore();
    batch.mockRestore();
  });

  it("leaves the days and the window whole when adding days fails (rule 2)", async () => {
    const trip = { id: world.ours.id, startDate: "2026-09-01", endDate: "2026-09-01" };
    await db.update(schema.trip).set({ startDate: trip.startDate, endDate: trip.endDate }).where(eq(schema.trip.id, trip.id));

    await expect(extendTripDays(trip, "2026-09-01", 2, "nobody")).rejects.toThrow();

    expect((await listDays(trip.id)).map((d) => d.date)).toEqual(["2026-09-01"]);
    expect(await windowOf(trip.id)).toEqual({ startDate: "2026-09-01", endDate: "2026-09-01" });
  });

  it("appends the days and moves the end date out with them", async () => {
    const trip = { id: world.ours.id, startDate: "2026-09-01", endDate: "2026-09-01" };
    await db
      .update(schema.trip)
      .set({ startDate: trip.startDate, endDate: trip.endDate })
      .where(eq(schema.trip.id, trip.id));

    await extendTripDays(trip, "2026-09-01", 2, world.admin);

    expect((await listDays(trip.id)).map((d) => d.date)).toEqual([
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
    ]);
    expect(await windowOf(trip.id)).toEqual({
      startDate: "2026-09-01",
      endDate: "2026-09-03",
    });
  });

  it("leaves an undated trip undated — appending a day does not settle it", async () => {
    const trip = { id: world.ours.id, startDate: null, endDate: null };

    await extendTripDays(trip, "2026-09-01", 1, world.admin);

    expect((await listDays(trip.id)).map((d) => d.date)).toContain("2026-09-02");
    expect(await windowOf(trip.id)).toEqual({ startDate: null, endDate: null });
  });

  it("never pulls the end date inwards", async () => {
    const trip = { id: world.ours.id, startDate: "2026-09-01", endDate: "2026-09-20" };
    await db
      .update(schema.trip)
      .set({ startDate: trip.startDate, endDate: trip.endDate })
      .where(eq(schema.trip.id, trip.id));

    await extendTripDays(trip, "2026-09-01", 1, world.admin);

    expect(await windowOf(trip.id)).toEqual({
      startDate: "2026-09-01",
      endDate: "2026-09-20",
    });
  });
});

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

describe("the size of a window", () => {
  it("refuses an end before the start rather than emptying the trip", async () => {
    await expect(setTripWindow(world.ours.id, "2026-09-10", "2026-09-01", world.admin)).rejects.toThrow(
      /before the start/,
    );
    expect(await listDayIds(world.ours.id)).toEqual([world.ours.dayId]);
  });

  it("refuses a window longer than a year", async () => {
    await expect(setTripWindow(world.ours.id, "2026-01-01", "2030-01-01", world.admin)).rejects.toThrow(
      /year/,
    );
  });

  it("refuses to add days past a year, or a count that is not a count", async () => {
    const trip = { id: world.ours.id, startDate: null, endDate: null };
    await expect(extendTripDays(trip, "2026-09-01", 5000, world.admin)).rejects.toThrow(/year/);
    await expect(extendTripDays(trip, "2026-09-01", 0, world.admin)).rejects.toThrow();
    await expect(extendTripDays(trip, "not-a-date", 1, world.admin)).rejects.toThrow();
  });
});
