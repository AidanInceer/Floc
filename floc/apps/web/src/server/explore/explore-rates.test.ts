import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { ensureProfile, updateProfileFields } from "@/server/auth/profile";
import { loadExploreRates } from "@/server/explore/explore-rates";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});
afterEach(() => vi.unstubAllGlobals());

function stubProvider() {
  const fn = vi.fn(async (url: string) => ({
    ok: true,
    json: async () => ({
      date: "2026-09-16",
      rates: url.includes("base=EUR") ? { GBP: 0.8 } : { EUR: 1.25 },
    }),
  }));
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("loadExploreRates", () => {
  it("quotes into GBP for someone signed out", async () => {
    const fetchMock = stubProvider();
    const rates = await loadExploreRates(null);
    expect(rates?.GBP).toBe(1);
    expect(rates?.EUR).toBeCloseTo(0.8);
    expect(String(fetchMock.mock.calls[0][0])).toContain("base=GBP");
  });

  it("quotes into the viewer's home currency", async () => {
    await ensureProfile(world.admin);
    await updateProfileFields(world.admin, { homeCurrency: "EUR" });
    const fetchMock = stubProvider();
    const rates = await loadExploreRates(world.admin);
    expect(rates?.EUR).toBe(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("base=EUR");
  });

  it("is null when there are no rates anywhere", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("down"); }));
    expect(await loadExploreRates(null)).toBeNull();
  });
});
