import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { findTripAccess } from "@/server/access";
import { ensureProfile } from "@/server/auth/profile";
import { readEstimateChoices, readTravelProfile } from "@/server/money/estimate/estimate-store";
import { givePro, migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";

import { saveBudget, saveOwnLine, saveTravelProfile, saveTripNights, saveTripStyle, saveTripTravel } from "./estimate-save";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  await ensureProfile(world.admin);
  await ensureProfile(world.member);
});

async function as(viewerId: string) {
  const access = await findTripAccess(world.ours.id, viewerId);
  if (!access) throw new Error("no access");
  return access;
}

describe("estimate writes", () => {
  it("refuse a free member, even when another member of the trip is Pro (ADR-057)", async () => {
    await givePro(world.admin);
    const access = await as(world.member);
    await expect(saveBudget(access, 50000)).rejects.toThrow("Floc Pro");
    await expect(saveOwnLine(access, "stay", { figure: 1000 })).rejects.toThrow("Floc Pro");
    await expect(saveTripStyle(access, { cabin: "first" })).rejects.toThrow("Floc Pro");
    await expect(saveTripTravel(access, "train")).rejects.toThrow("Floc Pro");
    await expect(saveOwnLine(access, "stay", { notNeeded: true })).rejects.toThrow("Floc Pro");
    await expect(saveTravelProfile(world.member, { homeAirport: "LHR" })).rejects.toThrow("Floc Pro");
  });

  it("keep a Pro member's budget and figures in their home currency", async () => {
    await givePro(world.admin);
    const access = await as(world.admin);
    await saveBudget(access, 110000);
    await saveOwnLine(access, "flights", { figure: 15000 });
    const mine = await readEstimateChoices(world.ours.id, world.admin);
    expect(mine.budget).toEqual({ amountMinor: 110000, currency: "GBP" });
    expect(mine.own.flights).toEqual({ figure: 15000, budget: null, currency: "GBP", notNeeded: false });
  });

  it("refuse an amount that is not a whole, sensible number of minor units (rule 1)", async () => {
    await givePro(world.admin);
    const access = await as(world.admin);
    await expect(saveBudget(access, -1)).rejects.toThrow();
    await expect(saveBudget(access, 12.5)).rejects.toThrow();
    await expect(saveOwnLine(access, "food", { budget: 1e12 })).rejects.toThrow();
  });

  it("refuse nights outside one to a year", async () => {
    await givePro(world.admin);
    const access = await as(world.admin);
    await expect(saveTripNights(access, 0)).rejects.toThrow();
    await expect(saveTripNights(access, 400)).rejects.toThrow();
    await saveTripNights(access, 5);
    expect((await readEstimateChoices(world.ours.id, world.admin)).nights).toBe(5);
  });

  it("refuse an airport that is not three letters", async () => {
    await givePro(world.admin);
    await expect(saveTravelProfile(world.admin, { homeAirport: "London" })).rejects.toThrow();
    await saveTravelProfile(world.admin, { homeAirport: "man", pace: "easy" });
    expect(await readTravelProfile(world.admin)).toMatchObject({ homeAirport: "MAN", pace: "easy" });
  });
});
