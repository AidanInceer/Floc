import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { ensureProfile } from "@/server/auth/profile";
import { givePro, migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";

import { estimatePort } from "./api-port-estimate";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  await ensureProfile(world.admin);
  await ensureProfile(world.member);
});

describe("estimatePort", () => {
  it("gives a free member the lock and no figures", async () => {
    expect(await estimatePort.loadEstimate(world.member, world.ours.id)).toEqual({ pro: false, view: null });
  });

  it("gives a Pro member their own estimate, budget included", async () => {
    await givePro(world.admin);
    await estimatePort.setEstimateBudget(world.admin, world.ours.id, 90000);
    const { pro, view } = await estimatePort.loadEstimate(world.admin, world.ours.id);
    expect(pro).toBe(true);
    expect(view?.plan.budget).toBe(90000);
    expect(view?.plan.lines).toHaveLength(5);
  });

  it("answers a stranger as if the trip were not there (rule 5)", async () => {
    await givePro(world.outsider);
    await expect(estimatePort.loadEstimate(world.outsider, world.ours.id)).rejects.toThrow("No such trip.");
    await expect(estimatePort.setEstimateBudget(world.outsider, world.ours.id, 100)).rejects.toThrow("No such trip.");
  });

  it("keeps the settings on the profile", async () => {
    await givePro(world.admin);
    await estimatePort.setEstimateSettings(world.admin, { homeAirport: "edi", pace: "active" });
    expect(await estimatePort.loadEstimateSettings(world.admin)).toEqual({
      pro: true,
      homeAirport: "EDI",
      inferred: null,
      style: { cabin: "economy", stay: "mid", pace: "active" },
    });
  });
});
