/** A member's writes stop at the same ceilings the pages read to, so one script cannot fill a trip for everyone. */
import { isRefusal } from "@floc/core/errors/refusal";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { insertIdea } from "@/server/ideas/ideas";
import { setAvailability } from "@/server/itinerary/availability";
import { extendTripDays, insertEvent } from "@/server/itinerary/itinerary";
import { LIMITS } from "@/server/limits";
import { writeExpense } from "@/server/money/money";
import { insertNote } from "@/server/notes/notes";
import { insertPackingLine, insertPersonalPackingLine } from "@/server/packing/packing";
import { insertNudge } from "@/server/trips/roster";
import { insertTripLink } from "@/server/trips/trip-links";
import { createTripWithAdmin } from "@/server/trips/trips";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";

let world: Scenario;

beforeAll(migrateTestDb);

beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

async function refused(work: () => Promise<unknown>): Promise<boolean> {
  try {
    await work();
    return false;
  } catch (error) {
    return isRefusal(error);
  }
}

const many = <T>(n: number, row: (i: number) => T) => Array.from({ length: n }, (_, i) => row(i));

async function insertInChunks<T>(table: Parameters<typeof db.insert>[0], rows: T[]) {
  for (let i = 0; i < rows.length; i += 200) await db.insert(table).values(rows.slice(i, i + 200) as never);
}

const isoDay = (i: number) => new Date(Date.UTC(2030, 0, 1 + i)).toISOString().slice(0, 10);

describe("the itinerary", () => {
  it("refuses an event on a day that already holds as many as it can", async () => {
    await insertInChunks(schema.dayEvent, many(LIMITS.eventsPerDay - 2, (i) => ({ dayId: world.ours.dayId, type: "activity" as const, title: `E${i}`, orderIndex: i + 2 })));
    expect(await refused(() => insertEvent(world.ours.dayId, { type: "activity", title: "Flood" }))).toBe(true);
  });

  it("refuses days that would take a trip past a year", async () => {
    const trip = { id: world.ours.id, startDate: null, endDate: null };
    await insertInChunks(schema.day, many(LIMITS.days - 2, (i) => ({ tripId: world.ours.id, date: isoDay(i) })));
    expect(await refused(() => extendTripDays(trip, "2040-01-01", 2, world.admin))).toBe(true);
  });
});

describe("date marks", () => {
  it("refuses more dates in one go than one person can hold", async () => {
    const dates = many(LIMITS.availabilityPerPerson + 1, isoDay);
    expect(await refused(() => setAvailability(world.ours.id, world.member, dates, true))).toBe(true);
  });

  it("refuses new dates past one person's ceiling, but still lets them change the ones they have", async () => {
    const dates = many(LIMITS.availabilityPerPerson, isoDay);
    for (let i = 0; i < dates.length; i += 300) await setAvailability(world.ours.id, world.member, dates.slice(i, i + 300), true);
    expect(await refused(() => setAvailability(world.ours.id, world.member, ["2041-06-01"], true))).toBe(true);
    expect(await refused(() => setAvailability(world.ours.id, world.member, dates.slice(0, 5), false))).toBe(false);
  });
});

describe("the trip's lists", () => {
  it("refuses an idea past the trip's ceiling", async () => {
    await insertInChunks(schema.idea, many(LIMITS.ideas, (i) => ({ tripId: world.ours.id, createdBy: world.admin, title: `I${i}` })));
    expect(await refused(() => insertIdea({ tripId: world.ours.id, createdBy: world.admin, title: "One more" }))).toBe(true);
  });

  it("refuses a link past the trip's ceiling", async () => {
    await insertInChunks(schema.tripLink, many(LIMITS.tripLinks, (i) => ({ tripId: world.ours.id, createdBy: world.admin, url: `https://example.com/${i}` })));
    expect(await refused(() => insertTripLink({ tripId: world.ours.id, createdBy: world.admin, url: "https://example.com/x", label: null }))).toBe(true);
  });

  it("refuses a shared or personal packing line past the list's ceiling", async () => {
    await insertInChunks(schema.packingLine, many(LIMITS.packingLines, (i) => ({ tripId: world.ours.id, createdBy: world.admin, label: `L${i}`, category: "essentials" as const })));
    expect(await refused(() => insertPackingLine(world.ours.id, world.admin, "One more", "essentials"))).toBe(true);
    await insertInChunks(schema.packingLine, many(LIMITS.packingLines, (i) => ({ tripId: world.ours.id, createdBy: world.member, ownerId: world.member, label: `M${i}`, category: "essentials" as const })));
    expect(await refused(() => insertPersonalPackingLine(world.ours.id, world.member, "One more", "essentials"))).toBe(true);
  });

  it("refuses a new expense past the ledger's ceiling", async () => {
    const fields = { dayId: null, paidBy: world.admin, description: "Coffee", amountMinor: 300, currency: "GBP" as const, splitType: "exact" as const, category: "food" as const, notes: null };
    await insertInChunks(schema.expense, many(LIMITS.expenses, () => ({ tripId: world.ours.id, createdBy: world.admin, ...fields })));
    expect(await refused(() => writeExpense({ tripId: world.ours.id, createdBy: world.admin, fields, splits: [{ userId: world.admin, owedAmountMinor: 300 }] }))).toBe(true);
  });

  it("refuses a comment past the thread's ceiling", async () => {
    const thread = { tripId: world.ours.id, scope: "day_event" as const, scopeId: world.ours.eventId };
    await insertInChunks(schema.note, many(LIMITS.commentsPerThread, (i) => ({ ...thread, createdBy: world.admin, body: `C${i}` })));
    expect(await refused(() => insertNote({ ...thread, createdBy: world.admin, parentId: null, body: "One more" }))).toBe(true);
  });
});

describe("people", () => {
  it("refuses a nudge past one person's daily ceiling on a trip", async () => {
    const nudge = { tripId: world.ours.id, fromUserId: world.admin, toUserId: world.member, tab: "dates" as const, message: null };
    for (let i = 0; i < LIMITS.nudgesPerDay; i++) await insertNudge(nudge);
    expect(await refused(() => insertNudge(nudge))).toBe(true);
  });

  it("refuses a new trip for someone already on as many as Floc holds", async () => {
    const trips = many(LIMITS.tripsPerUser, (i) => ({ name: `T${i}`, createdBy: world.member, inviteToken: `t-${i}` }));
    for (let i = 0; i < trips.length; i += 200) {
      const rows = await db.insert(schema.trip).values(trips.slice(i, i + 200)).returning({ id: schema.trip.id });
      await db.insert(schema.tripMembership).values(rows.map((r) => ({ tripId: r.id, userId: world.member, role: "admin" as const })));
    }
    expect(await refused(() => createTripWithAdmin({ name: "One more", startDate: null, endDate: null, createdBy: world.member }))).toBe(true);
  });
});
