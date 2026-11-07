import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_BOOKING_SITES } from "@floc/core/trip/booking-sites";
import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { bookingSitesOf, toggleBookingSite } from "@/server/auth/booking-sites";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

describe("your booking sites", () => {
  it("are today's two a kind until you change them", async () => {
    expect(await bookingSitesOf(world.member)).toEqual(DEFAULT_BOOKING_SITES);
  });

  it("keep a site you add, for you only", async () => {
    const after = await toggleBookingSite(world.member, "stays", "Airbnb");
    expect(after.stays).toEqual(["Booking.com", "Trip.com", "Airbnb"]);
    expect((await bookingSitesOf(world.member)).stays).toEqual(["Booking.com", "Trip.com", "Airbnb"]);
    expect(await bookingSitesOf(world.admin)).toEqual(DEFAULT_BOOKING_SITES);
  });

  it("drop a site you untick", async () => {
    await toggleBookingSite(world.member, "flights", "Google Flights");
    expect((await bookingSitesOf(world.member)).flights).toEqual(["Skyscanner"]);
  });

  it("refuse to empty a kind", async () => {
    await toggleBookingSite(world.member, "flights", "Google Flights");
    const after = await toggleBookingSite(world.member, "flights", "Skyscanner");
    expect(after.flights).toEqual(["Skyscanner"]);
  });

  it("read a bad stored value as the default", async () => {
    await toggleBookingSite(world.member, "stays", "Airbnb");
    await db.update(schema.userProfile).set({ bookingSites: "not a list" }).where(eq(schema.userProfile.userId, world.member));
    expect(await bookingSitesOf(world.member)).toEqual(DEFAULT_BOOKING_SITES);
  });
});
