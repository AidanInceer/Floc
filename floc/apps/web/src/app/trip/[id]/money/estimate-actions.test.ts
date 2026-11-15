import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { ensureProfile } from "@/server/auth/profile";
import { readEstimateChoices, readTravelProfile } from "@/server/money/estimate/estimate-store";
import { expectNotFound, givePro, migrateTestDb, resetDb, seedScenario, signIn, type Scenario } from "@/test/db";

import { saveBudgetForm, saveHomeAirportForm, saveLineForm, saveNightsForm, saveStyleForm, saveTravelStyleForm, resetTripStyle } from "./estimate-actions";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  await ensureProfile(world.admin);
  await givePro(world.admin);
  signIn(world.admin);
});

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [k, v] of Object.entries(fields)) data.set(k, v);
  return data;
};

describe("estimate actions", () => {
  it("save a budget typed as pounds, and clear it when emptied", async () => {
    expect(await saveBudgetForm(world.ours.id, form({ amount: "1,100" }))).toEqual({});
    expect((await readEstimateChoices(world.ours.id, world.admin)).budget).toEqual({ amountMinor: 110000, currency: "GBP" });
    await saveBudgetForm(world.ours.id, form({ amount: "" }));
    expect((await readEstimateChoices(world.ours.id, world.admin)).budget).toBeNull();
  });

  it("say what is wrong with an amount instead of throwing", async () => {
    expect(await saveBudgetForm(world.ours.id, form({ amount: "lots" }))).toEqual({ error: "Enter an amount, such as 450." });
  });

  it("save a line's figure and budget, and go back to the guide", async () => {
    await saveLineForm(world.ours.id, form({ line: "stay", figure: "400", budget: "450" }));
    expect((await readEstimateChoices(world.ours.id, world.admin)).own.stay).toMatchObject({ figure: 40000, budget: 45000 });
    await saveLineForm(world.ours.id, form({ line: "stay", figure: "", budget: "" }));
    expect((await readEstimateChoices(world.ours.id, world.admin)).own.stay).toBeUndefined();
  });

  it("refuse a line that is not one of the five", async () => {
    expect(await saveLineForm(world.ours.id, form({ line: "souvenirs", figure: "10" }))).toEqual({ error: "That line is not part of the estimate." });
  });

  it("set and reset the style for this trip", async () => {
    await saveStyleForm(world.ours.id, form({ cabin: "business", stay: "high", pace: "easy" }));
    expect((await readEstimateChoices(world.ours.id, world.admin)).style).toEqual({ cabin: "business", stay: "high", pace: "easy" });
    await resetTripStyle(world.ours.id);
    expect((await readEstimateChoices(world.ours.id, world.admin)).style).toEqual({ cabin: null, stay: null, pace: null });
  });

  it("save nights and a home airport", async () => {
    await saveNightsForm(world.ours.id, form({ nights: "5" }));
    expect((await readEstimateChoices(world.ours.id, world.admin)).nights).toBe(5);
    await saveHomeAirportForm(form({ airport: "bhx" }));
    expect((await readTravelProfile(world.admin)).homeAirport).toBe("BHX");
  });

  it("save the profile travel style", async () => {
    await saveTravelStyleForm(form({ cabin: "premium", stay: "budget", pace: "active" }));
    expect(await readTravelProfile(world.admin)).toMatchObject({ cabin: "premium", stay: "budget", pace: "active" });
  });

  it("refuse a stranger as if the trip were not there (rule 5)", async () => {
    signIn(world.outsider);
    await expectNotFound(() => saveBudgetForm(world.ours.id, form({ amount: "100" })));
  });

  it("refuse a free member in words", async () => {
    signIn(world.member);
    expect(await saveBudgetForm(world.ours.id, form({ amount: "100" }))).toEqual({ error: "That's a Floc Pro feature." });
  });
});
