import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { ensureProfile, getProfile } from "@/server/auth/profile";
import {
  readEstimateChoices,
  readTravelProfile,
  setBudget,
  setOwnLine,
  setTravelProfile,
  setTripNights,
  setTripStyle,
  setTripTravel,
} from "@/server/money/estimate/estimate-store";
import { addMember, removeMembership } from "@/server/trips/roster";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

describe("a member's own estimate choices", () => {
  it("start empty", async () => {
    expect(await readEstimateChoices(world.ours.id, world.admin)).toEqual({
      style: { cabin: null, stay: null, pace: null },
      nights: null,
      travel: null,
      budget: null,
      own: {},
    });
  });

  it("keep a budget, figures and line budgets for that member only", async () => {
    await setBudget(world.ours.id, world.admin, { amountMinor: 110000, currency: "GBP" });
    await setOwnLine(world.ours.id, world.admin, "stay", { figure: 40000 }, "GBP");
    await setOwnLine(world.ours.id, world.admin, "stay", { budget: 45000 }, "GBP");

    const mine = await readEstimateChoices(world.ours.id, world.admin);
    expect(mine.budget).toEqual({ amountMinor: 110000, currency: "GBP" });
    expect(mine.own.stay).toEqual({ figure: 40000, budget: 45000, currency: "GBP", notNeeded: false });

    const theirs = await readEstimateChoices(world.ours.id, world.member);
    expect(theirs.budget).toBeNull();
    expect(theirs.own).toEqual({});
  });

  it("forget a line once its figure and budget are both cleared", async () => {
    await setOwnLine(world.ours.id, world.admin, "food", { figure: 30000 }, "GBP");
    await setOwnLine(world.ours.id, world.admin, "food", { figure: null }, "GBP");
    expect((await readEstimateChoices(world.ours.id, world.admin)).own).toEqual({});

    await setOwnLine(world.ours.id, world.admin, "food", { figure: 25000 }, "GBP");
    expect((await readEstimateChoices(world.ours.id, world.admin)).own.food?.figure).toBe(25000);
  });

  it("keep how a member travels on this trip for that member only", async () => {
    await setTripTravel(world.ours.id, world.admin, "train");
    expect((await readEstimateChoices(world.ours.id, world.admin)).travel).toBe("train");
    expect((await readEstimateChoices(world.ours.id, world.member)).travel).toBeNull();
    await setTripTravel(world.ours.id, world.admin, "flights");
    expect((await readEstimateChoices(world.ours.id, world.admin)).travel).toBeNull();
  });

  it("forget the old figure, and keep the line's budget, when the way of travelling changes", async () => {
    await setOwnLine(world.ours.id, world.admin, "flights", { figure: 15000, budget: 20000 }, "GBP");
    await setTripTravel(world.ours.id, world.admin, "ferry");
    expect((await readEstimateChoices(world.ours.id, world.admin)).own.flights).toMatchObject({ figure: null, budget: 20000 });
  });

  it("keep a figure when the same way of travelling is picked again", async () => {
    await setTripTravel(world.ours.id, world.admin, "train");
    await setOwnLine(world.ours.id, world.admin, "flights", { figure: 8000 }, "GBP");
    await setTripTravel(world.ours.id, world.admin, "train");
    expect((await readEstimateChoices(world.ours.id, world.admin)).own.flights?.figure).toBe(8000);
  });

  it("keep a line out of the budget with its figure until it is added back", async () => {
    await setOwnLine(world.ours.id, world.admin, "stay", { figure: 40000 }, "GBP");
    await setOwnLine(world.ours.id, world.admin, "stay", { notNeeded: true }, "GBP");
    expect((await readEstimateChoices(world.ours.id, world.admin)).own.stay).toMatchObject({ figure: 40000, notNeeded: true });
    await setOwnLine(world.ours.id, world.admin, "stay", { notNeeded: false }, "GBP");
    expect((await readEstimateChoices(world.ours.id, world.admin)).own.stay).toMatchObject({ figure: 40000, notNeeded: false });
  });

  it("remember a removed line that has no figure, and forget it once added back", async () => {
    await setOwnLine(world.ours.id, world.admin, "food", { notNeeded: true }, "GBP");
    expect((await readEstimateChoices(world.ours.id, world.admin)).own.food?.notNeeded).toBe(true);
    await setOwnLine(world.ours.id, world.admin, "food", { notNeeded: false }, "GBP");
    expect((await readEstimateChoices(world.ours.id, world.admin)).own.food).toBeUndefined();
  });

  it("keep a member's plan through leaving the trip and joining again", async () => {
    await setBudget(world.ours.id, world.member, { amountMinor: 90000, currency: "GBP" });
    await setTripStyle(world.ours.id, world.member, { stay: "high" });
    await setTripNights(world.ours.id, world.member, 4);
    await setTripTravel(world.ours.id, world.member, "train");

    await removeMembership(world.ours.id, world.member, world.admin);
    await addMember(world.ours.id, world.member);

    expect(await readEstimateChoices(world.ours.id, world.member)).toMatchObject({
      style: { cabin: null, stay: "high", pace: null },
      nights: 4,
      travel: "train",
      budget: { amountMinor: 90000, currency: "GBP" },
    });
  });

  it("clear the budget", async () => {
    await setBudget(world.ours.id, world.admin, { amountMinor: 50000, currency: "EUR" });
    await setBudget(world.ours.id, world.admin, null);
    expect((await readEstimateChoices(world.ours.id, world.admin)).budget).toBeNull();
  });

  it("keep a style and nights for this trip without touching the profile", async () => {
    await ensureProfile(world.admin);
    await setTravelProfile(world.admin, { cabin: "business" });
    await setTripStyle(world.ours.id, world.admin, { cabin: "economy", pace: "active" });
    await setTripNights(world.ours.id, world.admin, 5);

    const mine = await readEstimateChoices(world.ours.id, world.admin);
    expect(mine.style).toEqual({ cabin: "economy", stay: null, pace: "active" });
    expect(mine.nights).toBe(5);
    expect((await readTravelProfile(world.admin)).cabin).toBe("business");

    await setTripStyle(world.ours.id, world.admin, null);
    expect((await readEstimateChoices(world.ours.id, world.admin)).style).toEqual({ cabin: null, stay: null, pace: null });
  });
});

describe("travel profile", () => {
  it("keeps a home airport in capitals and a travel style", async () => {
    await ensureProfile(world.admin);
    await setTravelProfile(world.admin, { homeAirport: "lhr", stay: "high" });
    expect(await readTravelProfile(world.admin)).toEqual({ homeAirport: "LHR", cabin: null, stay: "high", pace: null });
    expect((await getProfile(world.admin))?.homeAirport).toBe("LHR");
  });
});
