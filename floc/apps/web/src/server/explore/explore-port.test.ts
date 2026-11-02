import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { webPort } from "@/server/api-port/api-port";
import { ensureProfile, updateProfileFields } from "@/server/auth/profile";
import { clearRatesMemo } from "@/server/money/fx";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  clearRatesMemo();
  world = await seedScenario();
});
afterEach(() => vi.unstubAllGlobals());

describe("Explore through the port", () => {
  it("gives the phone the rates for the viewer's own currency", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ date: "2026-11-01", rates: { GBP: 0.8, USD: 1.04 } }) })));
    await ensureProfile(world.member);
    await updateProfileFields(world.member, { homeCurrency: "USD" });

    const { finder, rates } = await webPort.loadExplore(world.member);
    expect(finder).toBeNull();
    expect(rates?.home).toBe("USD");
    expect(rates?.toHome.EUR).toBeCloseTo(1.04, 10);
  });

  it("sends no rates when none can be had, so prices stay in their own currency (rule 11)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("down"); }));
    expect((await webPort.loadExplore(world.member)).rates).toBeNull();
  });
});
