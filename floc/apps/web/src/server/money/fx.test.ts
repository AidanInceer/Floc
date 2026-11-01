/**
 * The rate cache and its fallback chain (ticket 253). The point of the cache
 * is that a provider outage degrades to yesterday's *labelled* rate rather
 * than to nothing — and that a stale rate is never served silently. Every
 * page reads one quote, so Overview and Money cannot show two figures.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb } from "@/test/db";
import { clearRatesMemo, getHomeRates } from "@/server/money/fx";

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  clearRatesMemo();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function stubFetch(body: unknown, ok = true) {
  const fn = vi.fn<(url: string, init?: RequestInit) => Promise<{ ok: boolean; json: () => Promise<unknown> }>>(async () => ({ ok, json: async () => body }));
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

const QUOTE = { date: "2026-08-30", rates: { GBP: 0.8, USD: 1.04 } };

describe("getHomeRates", () => {
  it("turns the euro quote into home-per-unit multipliers", async () => {
    const fetchMock = stubFetch(QUOTE);
    const rates = await getHomeRates("GBP");

    expect(rates?.home).toBe("GBP");
    expect(rates?.toHome.GBP).toBe(1);
    // €12.50 → £10.00.
    expect(Math.round(1250 * (rates?.toHome.EUR ?? 0))).toBe(1000);
    expect(rates?.toHome.USD).toBeCloseTo(0.8 / 1.04, 10);
    expect(rates?.date).toBe("2026-08-30");
    expect(rates?.stale).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("asks the provider past Next's fetch cache", async () => {
    const fetchMock = stubFetch(QUOTE);
    await getHomeRates("GBP");
    expect(fetchMock.mock.calls[0][0]).toContain("base=EUR");
    expect(fetchMock.mock.calls[0][1]?.cache).toBe("no-store");
  });

  it("gives every page the same quote, even when the provider publishes in between", async () => {
    stubFetch(QUOTE);
    const overview = await getHomeRates("EUR");
    const later = stubFetch({ date: "2026-08-31", rates: { GBP: 0.9, USD: 1.1 } });
    const money = await getHomeRates("EUR");

    expect(money).toEqual(overview);
    expect(later).not.toHaveBeenCalled();
  });

  it("reads one quote for every home currency", async () => {
    const fetchMock = stubFetch(QUOTE);
    const gbp = await getHomeRates("GBP");
    const usd = await getHomeRates("USD");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((gbp?.toHome.USD ?? 0) * (usd?.toHome.GBP ?? 0)).toBeCloseTo(1, 10);
  });

  it("asks the provider again after an hour", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-08-31T09:00:00Z"));
    stubFetch(QUOTE);
    await getHomeRates("GBP");

    vi.setSystemTime(new Date("2026-08-31T10:00:01Z"));
    stubFetch({ date: "2026-08-31", rates: { GBP: 0.9, USD: 1.1 } });
    expect((await getHomeRates("GBP"))?.date).toBe("2026-08-31");
  });

  it("caches every quote it fetches", async () => {
    stubFetch(QUOTE);
    await getHomeRates("GBP");

    const rows = await db.select().from(schema.fxRate).all();
    expect(rows.map((r) => r.currency).sort()).toEqual(["GBP", "USD"]);
    expect(rows.every((r) => r.base === "EUR" && r.date === "2026-08-30")).toBe(true);
  });

  it("re-fetching the same day doesn't duplicate the cache", async () => {
    stubFetch(QUOTE);
    await getHomeRates("GBP");
    clearRatesMemo();
    await getHomeRates("GBP");
    expect(await db.select().from(schema.fxRate).all()).toHaveLength(2);
  });

  it("falls back to the newest cached day, labelled stale", async () => {
    stubFetch({ date: "2026-08-29", rates: { GBP: 0.85 } });
    await getHomeRates("GBP");
    clearRatesMemo();
    stubFetch({ date: "2026-08-30", rates: { GBP: 0.8 } });
    await getHomeRates("GBP");
    clearRatesMemo();

    stubDeadProvider();
    const rates = await getHomeRates("GBP");

    expect(rates?.stale).toBe(true);
    expect(rates?.date).toBe("2026-08-30");
    expect(rates?.toHome.EUR).toBeCloseTo(0.8, 10);
  });

  it("degrades to null with nothing fetched and nothing cached (rule 11)", async () => {
    stubDeadProvider();
    expect(await getHomeRates("GBP")).toBeNull();
  });

  it("degrades to null on a non-OK response with an empty cache", async () => {
    stubFetch({}, false);
    expect(await getHomeRates("GBP")).toBeNull();
  });

  it("degrades to null when the home currency is not quoted", async () => {
    stubFetch({ date: "2026-08-30", rates: { USD: 1.04 } });
    expect(await getHomeRates("GBP")).toBeNull();
  });

  it("drops an unusable quote rather than the whole publication", async () => {
    stubFetch({ date: "2026-08-30", rates: { GBP: 0.8, USD: 0 } });
    const rates = await getHomeRates("GBP");

    expect(rates?.toHome.USD).toBe(0);
    expect(rates?.toHome.EUR).toBeCloseTo(0.8, 10);
  });
});
