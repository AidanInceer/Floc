import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { ensureProfile, updateProfileFields } from "@/server/auth/profile";
import { clearRatesMemo } from "@/server/money/fx";
import { listingRates, viewerCurrency } from "@/server/money/viewer-currency";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  clearRatesMemo();
  world = await seedScenario();
});
afterEach(() => vi.unstubAllGlobals());

const from = (entries: Record<string, string>) => new Headers(entries);

describe("viewerCurrency", () => {
  it("uses a signed-in person's own currency, wherever they are", async () => {
    await ensureProfile(world.member);
    await updateProfileFields(world.member, { homeCurrency: "EUR" });
    expect(await viewerCurrency(world.member, from({ "cf-ipcountry": "US" }))).toBe("EUR");
  });

  it("guesses a guest's from where the request comes from", async () => {
    expect(await viewerCurrency(null, from({ "cf-ipcountry": "US" }))).toBe("USD");
    expect(await viewerCurrency(null, from({ "x-vercel-ip-country": "JP" }))).toBe("JPY");
    expect(await viewerCurrency(null, from({ "accept-language": "de-DE,de;q=0.9" }))).toBe("EUR");
  });

  it("gives a guest pounds when nothing says where they are", async () => {
    expect(await viewerCurrency(null, from({}))).toBe("GBP");
  });
});

describe("listingRates", () => {
  it("hands over the viewer's currency and its multipliers", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ date: "2026-11-01", rates: { GBP: 0.8, USD: 1.04 } }) })));
    const rates = await listingRates("GBP");
    expect(rates?.home).toBe("GBP");
    expect(rates?.toHome.EUR).toBeCloseTo(0.8, 10);
  });

  it("is null when no rate can be had (rule 11)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("down"); }));
    expect(await listingRates("GBP")).toBeNull();
  });
});
