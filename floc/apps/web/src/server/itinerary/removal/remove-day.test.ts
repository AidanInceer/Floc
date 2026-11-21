import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { listDays, setTripWindow } from "@/server/itinerary/itinerary";
import { listDayBookings, removeTripDay } from "@/server/itinerary/removal/remove-day";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

async function aWeek(tripId = world.ours.id) {
  await setTripWindow(tripId, "2026-11-01", "2026-11-07", world.admin);
  const days = await listDays(tripId);
  return Object.fromEntries(days.map((d) => [d.date.slice(8), d.id]));
}

async function tripOf(id: number) {
  return db
    .select({ id: schema.trip.id, startDate: schema.trip.startDate, endDate: schema.trip.endDate })
    .from(schema.trip)
    .where(eq(schema.trip.id, id))
    .get()
    .then((row) => row!);
}

async function anEvent(dayId: number, title: string, type: "activity" | "transport" = "activity") {
  const row = await db
    .insert(schema.dayEvent)
    .values({ dayId, type, title, orderIndex: 0 })
    .returning({ id: schema.dayEvent.id })
    .get();
  return row.id;
}

async function aFile(dayId: number, name: string, ownerId: string | null = null) {
  const row = await db
    .insert(schema.document)
    .values({
      tripId: world.ours.id, uploadedBy: world.admin, ownerId, name, dayId,
      storageKey: "k", mimeType: "application/pdf", sizeBytes: 1, category: "travel",
    })
    .returning({ id: schema.document.id })
    .get();
  return row.id;
}

const eventDay = async (id: number) =>
  (await db.select().from(schema.dayEvent).where(eq(schema.dayEvent.id, id)).get())!;

const dates = async (tripId = world.ours.id) => (await listDays(tripId)).map((d) => d.date);

describe("removing a day", () => {
  it("starts the trip a day later when the first day goes", async () => {
    const day = await aWeek();
    await removeTripDay(await tripOf(world.ours.id), day["01"], world.admin);

    expect(await dates()).toEqual(["02", "03", "04", "05", "06", "07"].map((d) => `2026-11-${d}`));
    expect(await tripOf(world.ours.id)).toMatchObject({ startDate: "2026-11-02", endDate: "2026-11-07" });
  });

  it("ends the trip a day earlier when the last day goes", async () => {
    const day = await aWeek();
    await removeTripDay(await tripOf(world.ours.id), day["07"], world.admin);

    expect(await dates()).toEqual(["01", "02", "03", "04", "05", "06"].map((d) => `2026-11-${d}`));
    expect(await tripOf(world.ours.id)).toMatchObject({ startDate: "2026-11-01", endDate: "2026-11-06" });
  });

  it("closes the gap when a middle day goes: later plans move a day earlier (rule 3)", async () => {
    const day = await aWeek();
    const gone = await anEvent(day["04"], "Museum");
    const moved = await anEvent(day["05"], "Boat trip");
    const placeRow = await db.insert(schema.place).values({ name: "Porto" }).returning().get();
    await db.update(schema.day).set({ overnightPlaceId: placeRow.id }).where(eq(schema.day.id, day["05"]));
    const file = await aFile(day["07"], "ticket.pdf");

    await removeTripDay(await tripOf(world.ours.id), day["04"], world.admin);

    expect(await dates()).toEqual(["01", "02", "03", "04", "05", "06"].map((d) => `2026-11-${d}`));
    expect(await tripOf(world.ours.id)).toMatchObject({ endDate: "2026-11-06" });
    expect((await eventDay(gone)).deletedAt).not.toBeNull();
    expect((await eventDay(moved)).dayId).toBe(day["04"]);
    const after = await listDays(world.ours.id);
    expect(after.find((d) => d.date === "2026-11-04")?.overnightPlaceId).toBe(placeRow.id);
    const doc = await db.select().from(schema.document).where(eq(schema.document.id, file)).get();
    expect(doc?.dayId).toBe(day["06"]);
  });

  it("moves an expense with its day", async () => {
    const day = await aWeek();
    const spend = await db
      .insert(schema.expense)
      .values({
        tripId: world.ours.id, dayId: day["06"], paidBy: world.admin, createdBy: world.admin,
        description: "Ferry", amountMinor: 1200, currency: "GBP", splitType: "even" as const,
      })
      .returning({ id: schema.expense.id })
      .get();

    await removeTripDay(await tripOf(world.ours.id), day["02"], world.admin);

    const row = await db.select().from(schema.expense).where(eq(schema.expense.id, spend.id)).get();
    expect(row?.dayId).toBe(day["05"]);
  });

  it("keeps the removed day's rows, soft-deleted (rule 8)", async () => {
    const day = await aWeek();
    await removeTripDay(await tripOf(world.ours.id), day["03"], world.admin);

    const last = await db.select().from(schema.day).where(eq(schema.day.id, day["07"])).get();
    expect(last?.deletedAt).not.toBeNull();
  });

  it("leaves the trip with no dates when its only day goes (rule 9)", async () => {
    await setTripWindow(world.ours.id, "2026-11-01", "2026-11-01", world.admin);
    const [only] = await listDays(world.ours.id);

    await removeTripDay(await tripOf(world.ours.id), only.id, world.admin);

    expect(await dates()).toEqual([]);
    expect(await tripOf(world.ours.id)).toMatchObject({ startDate: null, endDate: null });
  });

  it("does nothing with a day from another trip", async () => {
    await aWeek();
    await removeTripDay(await tripOf(world.ours.id), world.theirs.dayId, world.admin);

    expect(await dates()).toHaveLength(7);
    expect(await dates(world.theirs.id)).toEqual(["2026-09-01"]);
  });

  it("can be undone by adding the day back: the window grows again with a blank day", async () => {
    const day = await aWeek();
    await removeTripDay(await tripOf(world.ours.id), day["04"], world.admin);
    await setTripWindow(world.ours.id, "2026-11-01", "2026-11-07", world.admin);

    expect(await dates()).toHaveLength(7);
  });
});

describe("listDayBookings", () => {
  it("names transport and booking files, but not someone else's private file", async () => {
    const day = await aWeek();
    await anEvent(day["05"], "Flight to Rome", "transport");
    await anEvent(day["05"], "Gelato");
    await aFile(day["06"], "Hotel Lume.pdf");
    await aFile(day["06"], "Mo's passport.pdf", world.member);

    const bookings = await listDayBookings(world.ours.id, world.admin);

    expect(bookings).toEqual(
      expect.arrayContaining([
        { dayId: day["05"], label: "Flight to Rome" },
        { dayId: day["06"], label: "Hotel Lume.pdf" },
      ]),
    );
    expect(bookings).toHaveLength(2);
  });
});
