import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { getProfile } from "@/server/auth/profile";
import { readTravelStyle } from "@/server/auth/travel-style";
import { migrateTestDb, resetDb, seedScenario, signIn, type Scenario } from "@/test/db";

import { finishWelcomeForm } from "./actions";

let world: Scenario;

function form(fields: Record<string, string | string[]>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) for (const v of [value].flat()) fd.append(key, v);
  return fd;
}

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  signIn(world.member);
});

describe("finishing the welcome (#707)", () => {
  it("marks it seen with nothing answered, and changes nothing else", async () => {
    await finishWelcomeForm(new FormData());
    const profile = await getProfile(world.member);
    expect(profile?.tourSeenAt).toBeInstanceOf(Date);
    expect((await readTravelStyle(world.member)).homeAirport).toBeNull();
  });

  it("saves airport, currency, travel style and vibes, and marks it seen", async () => {
    await finishWelcomeForm(form({ airport: "DUB", currency: "EUR", cabin: "economy", stay: "mid", pace: "balanced", vibes: ["beaches", "museums"] }));
    expect(await getProfile(world.member)).toMatchObject({ homeCurrency: "EUR", vibeTags: ["beaches", "museums"] });
    expect(await readTravelStyle(world.member)).toMatchObject({
      homeAirport: "DUB",
      travelCabin: "economy",
      travelStay: "mid",
      travelPace: "balanced",
    });
    expect((await getProfile(world.member))?.tourSeenAt).toBeInstanceOf(Date);
  });
});
