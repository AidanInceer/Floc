import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { updateProfileFields, ensureProfile } from "@/server/auth/profile";
import { saveTravelStyle } from "@/server/auth/travel-style";
import { loadTaste } from "@/server/explore/explore-finder";
import { setTripSaved } from "@/server/explore/explore-saves";
import { loadPastTravel } from "@/server/explore/travel-read";
import { LIMITS } from "@/server/limits";
import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

const dated = (tripId: number, startDate: string | null, endDate: string | null) =>
  db.update(schema.trip).set({ startDate, endDate }).where(eq(schema.trip.id, tripId));

async function place(name: string, countryCode: string) {
  return (await db.insert(schema.place).values({ name, countryCode }).returning({ id: schema.place.id }).get()).id;
}

async function night(tripId: number, date: string, overnightPlaceId: number) {
  return (await db.insert(schema.day).values({ tripId, date, overnightPlaceId }).returning({ id: schema.day.id }).get()).id;
}

async function spend(tripId: number, currency: "GBP" | "EUR", shares: Record<string, number>) {
  const total = Object.values(shares).reduce((a, b) => a + b, 0);
  const row = await db
    .insert(schema.expense)
    .values({ tripId, createdBy: world.admin, paidBy: world.admin, description: "Dinner", amountMinor: total, currency, splitType: "exact" })
    .returning({ id: schema.expense.id })
    .get();
  await db.insert(schema.expenseSplit).values(Object.entries(shares).map(([userId, owedAmountMinor]) => ({ expenseId: row.id, userId, owedAmountMinor })));
}

async function finishedTrip(name: string, endDate: string) {
  const row = await db
    .insert(schema.trip)
    .values({ name, createdBy: world.admin, inviteToken: `token-${name}`, startDate: "2019-01-01", endDate })
    .returning({ id: schema.trip.id })
    .get();
  await db.insert(schema.tripMembership).values({ tripId: row.id, userId: world.admin, role: "admin" });
  return row.id;
}

describe("what Floc reads of your past travel", () => {
  it("is empty for someone who has done nothing", async () => {
    expect(await loadPastTravel(world.admin)).toEqual({ saved: [], wantToGo: [], past: [] });
  });

  it("reads a finished trip: its nights, countries, stops, moves and your own spend", async () => {
    await dated(world.ours.id, "2020-05-01", "2020-05-08");
    const lisbon = await place("Lisbon", "PT");
    const seville = await place("Seville", "ES");
    await night(world.ours.id, "2020-05-02", lisbon);
    await night(world.ours.id, "2020-05-03", lisbon);
    const moving = await night(world.ours.id, "2020-05-04", seville);
    await db.insert(schema.dayEvent).values([
      { dayId: moving, type: "transport", transportType: "train", orderIndex: 0 },
      { dayId: moving, type: "transport", transportType: "ferry", orderIndex: 1 },
      { dayId: moving, type: "food", title: "Lunch", orderIndex: 2 },
    ]);
    await spend(world.ours.id, "GBP", { [world.admin]: 30000, [world.member]: 45000 });
    await spend(world.ours.id, "GBP", { [world.admin]: 5000 });
    await spend(world.ours.id, "EUR", { [world.admin]: 12000 });

    const { past } = await loadPastTravel(world.admin);
    expect(past).toHaveLength(1);
    expect(past[0]!.nights).toBe(7);
    expect([...past[0]!.countries].sort()).toEqual(["ES", "PT"]);
    expect(past[0]!.stops).toBe(2);
    expect([...past[0]!.moves].sort()).toEqual(["ferry", "train"]);
    expect([...past[0]!.spend].sort((a, b) => a.currency.localeCompare(b.currency))).toEqual([
      { currency: "EUR", minor: 12000 },
      { currency: "GBP", minor: 35000 },
    ]);
  });

  it("leaves out a trip that has not ended, has no dates, was deleted or is not yours", async () => {
    await dated(world.ours.id, "2999-01-01", "2999-01-08");
    await dated(world.theirs.id, "2020-05-01", "2020-05-08");
    const gone = await finishedTrip("gone", "2020-03-01");
    await db.update(schema.trip).set({ deletedAt: new Date() }).where(eq(schema.trip.id, gone));
    expect((await loadPastTravel(world.admin)).past).toEqual([]);
    await dated(world.ours.id, null, null);
    expect((await loadPastTravel(world.admin)).past).toEqual([]);
  });

  it("reads only your latest finished trips, up to the cap", async () => {
    for (let i = 1; i <= LIMITS.fitPastTrips + 2; i++) await finishedTrip(`t${i}`, `2019-01-${String(i + 1).padStart(2, "0")}`);
    const nights = (await loadPastTravel(world.admin)).past.map((trip) => trip.nights).sort((a, b) => a - b);
    expect(nights).toHaveLength(LIMITS.fitPastTrips);
    expect(nights[0]).toBe(3);
  });

  it("reads the countries you want to go to, not the ones you have visited", async () => {
    await db.insert(schema.userCountryMark).values([
      { userId: world.admin, countryCode: "JP", state: "yellow" },
      { userId: world.admin, countryCode: "FR", state: "green" },
      { userId: world.admin, countryCode: "PE", state: "yellow", deletedAt: new Date() },
      { userId: world.member, countryCode: "NZ", state: "yellow" },
    ]);
    expect((await loadPastTravel(world.admin)).wantToGo).toEqual(["JP"]);
  });

  it("reads the listings you saved", async () => {
    await setTripSaved(world.admin, PRESET_TRIPS[0]!.id, true);
    await setTripSaved(world.admin, PRESET_TRIPS[1]!.id, true);
    await setTripSaved(world.admin, PRESET_TRIPS[1]!.id, false);
    await setTripSaved(world.member, PRESET_TRIPS[2]!.id, true);
    expect((await loadPastTravel(world.admin)).saved).toEqual([PRESET_TRIPS[0]!.id]);
  });

  it("makes one database read", async () => {
    await dated(world.ours.id, "2020-05-01", "2020-05-08");
    const execute = vi.spyOn(db.$client, "execute");
    await loadPastTravel(world.admin);
    expect(execute).toHaveBeenCalledTimes(1);
    execute.mockRestore();
  });
});

describe("your travel profile on Explore", () => {
  it("joins what you told Floc with what you have done", async () => {
    await ensureProfile(world.admin);
    await updateProfileFields(world.admin, { vibeTags: ["food first"] });
    await saveTravelStyle(world.admin, { travelStay: "mid", travelPace: "easy" });
    await dated(world.ours.id, "2020-05-01", "2020-05-08");
    const { travel } = await loadTaste(world.admin);
    expect(travel.vibes).toEqual(["food first"]);
    expect(travel.stay).toBe("mid");
    expect(travel.pace).toBe("easy");
    expect(travel.past).toHaveLength(1);
  });

  it("adds one database read to what Explore made before", async () => {
    await ensureProfile(world.admin);
    const execute = vi.spyOn(db.$client, "execute");
    await loadTaste(world.admin);
    expect(execute).toHaveBeenCalledTimes(2);
    execute.mockRestore();
  });
});
