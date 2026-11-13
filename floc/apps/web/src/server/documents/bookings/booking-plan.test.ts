/** From a booking file to the plan (#559): the member's own save makes the event, and rule 5 holds. */
import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "@/db";
import { dayEvent, document } from "@/db/schema";
import { findTripAccess } from "@/server/access";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";

import { addTravelFileToDays, putHotelFileOnDay } from "./booking-plan";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

async function file(tripId: number, ownerId: string | null, uploadedBy: string, category: "travel" | "hotel" = "travel") {
  const row = await db
    .insert(document)
    .values({ tripId, uploadedBy, ownerId, name: "Booking.pdf", storageKey: `${tripId}-${category}.pdf`, mimeType: "application/pdf", sizeBytes: 8, category })
    .returning({ id: document.id })
    .get();
  return row.id;
}

/** The API's access answers "not on this trip" for a row it will not hand over, whatever the reason (rule 5). */
const expectRefused = (work: () => Promise<unknown>) => expect(work()).rejects.toThrow("That is not on this trip.");
const access = async (userId: string, tripId = world.ours.id) => (await findTripAccess(tripId, userId))!;
const flight = (dayId: number) => ({ dayId, title: " FR 8347 · STN to OPO ", transportType: "flight", time: "06:25", endTime: "08:55" });

describe("a Travel file becomes a Days event", () => {
  it("makes a transport event on the chosen day, with the file on it", async () => {
    const id = await file(world.ours.id, world.member, world.member);
    expect(await addTravelFileToDays(await access(world.member), id, flight(world.ours.dayId))).toBeNull();

    const events = await db.select().from(dayEvent).where(eq(dayEvent.dayId, world.ours.dayId)).all();
    const made = events.find((event) => event.title === "FR 8347 · STN to OPO")!;
    expect(made).toMatchObject({ type: "transport", transportType: "flight", time: "06:25", endTime: "08:55" });
    const [doc] = await db.select().from(document).where(eq(document.id, id)).all();
    expect(doc).toMatchObject({ dayEventId: made.id, dayId: null, ownerId: world.member });
  });

  it("drops a way of travelling or a time that is not one", async () => {
    const id = await file(world.ours.id, world.member, world.member);
    await addTravelFileToDays(await access(world.member), id, { dayId: world.ours.dayId, title: "Ferry", transportType: "rocket", time: "25:00", endTime: null });
    const made = (await db.select().from(dayEvent).all()).find((event) => event.title === "Ferry")!;
    expect(made).toMatchObject({ transportType: null, time: null, endTime: null });
  });

  it("asks for a name, and makes nothing without one", async () => {
    const id = await file(world.ours.id, world.member, world.member);
    expect(await addTravelFileToDays(await access(world.member), id, { ...flight(world.ours.dayId), title: "  " })).toBe("Give the event a name.");
    expect(await db.select().from(dayEvent).all()).toHaveLength(4);
  });

  it("refuses somebody else's private file, and a day on another trip (rule 5)", async () => {
    const theirs = await file(world.ours.id, world.admin, world.admin);
    await expectRefused(async () => addTravelFileToDays(await access(world.member), theirs, flight(world.ours.dayId)));
    const mine = await file(world.ours.id, world.member, world.member, "hotel");
    await expectRefused(async () => addTravelFileToDays(await access(world.member), mine, flight(world.theirs.dayId)));
    expect(await db.select().from(dayEvent).all()).toHaveLength(4);
  });
});

describe("a Hotel file goes on its first night", () => {
  it("puts the file on the day", async () => {
    const id = await file(world.ours.id, world.member, world.member, "hotel");
    await putHotelFileOnDay(await access(world.member), id, world.ours.dayId);
    const [doc] = await db.select().from(document).where(eq(document.id, id)).all();
    expect(doc).toMatchObject({ dayId: world.ours.dayId, dayEventId: null });
  });

  it("refuses a day on another trip (rule 5)", async () => {
    const id = await file(world.ours.id, world.member, world.member, "hotel");
    await expectRefused(async () => putHotelFileOnDay(await access(world.member), id, world.theirs.dayId));
  });
});
