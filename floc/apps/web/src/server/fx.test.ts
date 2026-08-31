/**
 * The rate cache and its fallback chain (ticket 253). The point of the cache
 * is that a provider outage degrades to yesterday's *labelled* rate rather
 * than to nothing — and that a stale rate is never served silently.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb } from "@/test/db";
import { getHomeRates } from "@/server/fx";

beforeAll(migrateTestDb);
beforeEach(resetDb);
afterEach(() => vi.unstubAllGlobals());

function stubFetch(body: unknown, ok = true) {
  const fn = vi.fn(async () => ({ ok, json: async () => body }));
  vi.stubGlobal("fetch", fn);
  return fn;
}

function stubDeadProvider() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new Error("network down");
    }),
  );
}

describe("getHomeRates", () => {
  it("turns per-home rates into home-per-unit multipliers", async () => {
    // 1 GBP = 1.25 EUR, 1 GBP = 1.30 USD.
    const fetchMock = stubFetch({
      date: "2026-08-30",
      rates: { EUR: 1.25, USD: 1.3 },
    });
    const rates = await getHomeRates("GBP");

    expect(rates?.home).toBe("GBP");
    expect(rates?.toHome.GBP).toBe(1); // home is identity
    // €12.50 → £10.00: 1250 * (1/1.25) = 1000.
    expect(Math.round(1250 * (rates?.toHome.EUR ?? 0))).toBe(1000);
    expect(rates?.date).toBe("2026-08-30");
    expect(rates?.stale).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("caches every quote it fetches", async () => {
    stubFetch({ date: "2026-08-30", rates: { EUR: 1.25, USD: 1.3 } });
    await getHomeRates("GBP");

    const rows = await db.select().from(schema.fxRate).all();
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.currency).sort()).toEqual(["EUR", "USD"]);
    expect(rows.every((r) => r.base === "GBP" && r.date === "2026-08-30")).toBe(true);
  });

  it("re-fetching the same day doesn't duplicate the cache", async () => {
    stubFetch({ date: "2026-08-30", rates: { EUR: 1.25 } });
    await getHomeRates("GBP");
    await getHomeRates("GBP");
    expect(await db.select().from(schema.fxRate).all()).toHaveLength(1);
  });

  it("falls back to the newest cached day, labelled stale", async () => {
    stubFetch({ date: "2026-08-29", rates: { EUR: 1.2 } });
    await getHomeRates("GBP");
    stubFetch({ date: "2026-08-30", rates: { EUR: 1.25 } });
    await getHomeRates("GBP");

    stubDeadProvider();
    const rates = await getHomeRates("GBP");

    expect(rates?.stale).toBe(true);
    expect(rates?.date).toBe("2026-08-30"); // the newer of the two
    expect(rates?.toHome.EUR).toBeCloseTo(1 / 1.25, 10);
  });

  it("degrades to null with nothing fetched and nothing cached (rule 11)", async () => {
    stubDeadProvider();
    expect(await getHomeRates("GBP")).toBeNull();
  });

  it("degrades to null on a non-OK response with an empty cache", async () => {
    stubFetch({}, false);
    expect(await getHomeRates("GBP")).toBeNull();
  });

  it("drops an unusable quote rather than the whole publication", async () => {
    // A zero can't be inverted; the other 29 currencies still convert.
    stubFetch({ date: "2026-08-30", rates: { EUR: 0, USD: 1.3 } });
    const rates = await getHomeRates("GBP");

    expect(rates?.toHome.EUR).toBe(0); // reads as "no rate" at the call site
    expect(rates?.toHome.USD).toBeCloseTo(1 / 1.3, 10);
  });
});
