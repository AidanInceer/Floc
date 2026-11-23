import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { getProfile } from "@/server/auth/profile";
import { markTourSeen } from "@/server/auth/tour";
import { readTravelStyle } from "@/server/auth/travel-style";
import { finishWelcome, seedWelcomeCurrency, welcomeFor } from "@/server/auth/welcome/welcome";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

describe("the welcome, once per person (#707)", () => {
  it("is due for someone who has not finished or skipped it", async () => {
    expect((await welcomeFor(world.member))?.due).toBe(true);
  });

  it("is not due once the tour is marked seen", async () => {
    await markTourSeen(world.member);
    expect((await welcomeFor(world.member))?.due).toBe(false);
  });

  it("saves the answers and is not due again", async () => {
    await finishWelcome(world.member, { homeAirport: "DUB", travelCabin: "economy", travelStay: "mid", travelPace: "easy", vibeTags: ["beaches"] });
    const profile = await getProfile(world.member);
    expect(await readTravelStyle(world.member)).toMatchObject({ homeAirport: "DUB", travelCabin: "economy", travelStay: "mid", travelPace: "easy" });
    expect(profile?.vibeTags).toEqual(["beaches"]);
    expect(profile?.tourSeenAt).toBeInstanceOf(Date);
    expect((await welcomeFor(world.member))?.due).toBe(false);
  });

  it("keeps what was there when a step is skipped", async () => {
    await finishWelcome(world.member, { homeAirport: "LIS" });
    await finishWelcome(world.member, {});
    expect((await readTravelStyle(world.member)).homeAirport).toBe("LIS");
  });
});

describe("the home currency guess (#707, P1)", () => {
  it("sets the guessed currency while the welcome is still due", async () => {
    await seedWelcomeCurrency(world.member, "EUR");
    expect((await getProfile(world.member))?.homeCurrency).toBe("EUR");
  });

  it("never changes a currency once the welcome is done", async () => {
    await markTourSeen(world.member);
    await seedWelcomeCurrency(world.member, "EUR");
    expect((await getProfile(world.member))?.homeCurrency).toBe("GBP");
  });
});
