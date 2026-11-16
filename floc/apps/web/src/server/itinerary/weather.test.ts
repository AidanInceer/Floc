import { eq } from "drizzle-orm";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { db, schema } from "@/db";
import { getTripForecast, tripForecastAnchor } from "@/server/itinerary/weather";
import { addDays, today } from "@floc/core/dates/dates";
import { HORIZON_DAYS } from "@floc/core/itinerary/weather";
import {
  givePro,
  migrateTestDb,
  resetDb,
  seedScenario,
  type Scenario,
} from "@/test/db";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function anchorTrip(
  dayId: number,
  coords: { lat: number | null; lng: number | null } = { lat: 38.72, lng: -9.14 },
) {
  const place = await db
    .insert(schema.place)
    .values({
      name: "Lisbon",
      providerId: "osm:test:lisbon",
      lat: coords.lat,
      lng: coords.lng,
    })
    .returning({ id: schema.place.id })
    .get();
  await db
    .update(schema.day)
    .set({ overnightPlaceId: place.id })
    .where(eq(schema.day.id, dayId));
  return place.id;
}

const ACCRA = { lat: 5.6037, lng: -0.187 };

type Entry = { time: string; data: Record<string, unknown> };

function entry(time: string, temp: number, block: "next_1_hours" | "next_6_hours", symbol: string, rain = 0): Entry {
  return {
    time,
    data: {
      instant: { details: { air_temperature: temp } },
      [block]: { summary: { symbol_code: symbol }, details: { precipitation_amount: rain } },
    },
  };
}

function metBody(from: string, days = HORIZON_DAYS) {
  const series: Entry[] = [];
  for (let h = 0; h < 48; h++) {
    const date = addDays(from, Math.floor(h / 24));
    const hh = String(h % 24).padStart(2, "0");
    series.push(entry(`${date}T${hh}:00:00Z`, 18 + (h % 6), "next_1_hours", "clearsky_day", h === 13 ? 0.5 : 0));
  }
  for (let d = 2; d <= days; d++) {
    for (const hh of ["00", "06", "12", "18"]) {
      series.push(entry(`${addDays(from, d)}T${hh}:00:00Z`, 20 + d, "next_6_hours", d === 4 ? "lightrain" : "fair_day", d === 4 ? 2 : 0));
    }
  }
  return { properties: { timeseries: series } };
}

function stubFetch(body: unknown) {
  const fn = vi.fn(async () => ({ ok: true, json: async () => body }));
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("tripForecastAnchor", () => {
  it("returns null when no day points at a place with coordinates", async () => {
    expect(await tripForecastAnchor(world.ours.id)).toBeNull();
  });

  it("returns null when the placed place has no coordinates", async () => {
    await anchorTrip(world.ours.dayId, { lat: null, lng: null });
    expect(await tripForecastAnchor(world.ours.id)).toBeNull();
  });

  it("names the earliest placed day's place", async () => {
    await anchorTrip(world.ours.dayId);
    expect(await tripForecastAnchor(world.ours.id)).toEqual({
      lat: 38.72,
      lng: -9.14,
      placeName: "Lisbon",
    });
  });
});

describe("getTripForecast", () => {
  beforeEach(() => givePro(world.admin));

  it("refuses a free trip however it asks, without calling out", async () => {
    await anchorTrip(world.ours.dayId);
    const fetchMock = stubFetch(metBody(today()));
    await db.delete(schema.subscription);

    expect(await getTripForecast(world.ours.id)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("asks MET Norway for the place, names Floc, and maps the days in the place's own time", async () => {
    await anchorTrip(world.ours.dayId, ACCRA);
    const from = today();
    const fetchMock = stubFetch(metBody(from));

    const forecast = await getTripForecast(world.ours.id);

    expect(forecast).not.toBeNull();
    const [calledUrl, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(calledUrl).toContain("api.met.no");
    expect(calledUrl).toContain("lat=5.6037");
    expect(calledUrl).toContain("lon=-0.1870");
    expect(new Headers(init.headers).get("user-agent")).toContain("floc.live");

    expect(forecast!.placeName).toBe("Lisbon");
    expect(forecast!.from).toBe(from);
    expect(forecast!.horizonEnd).toBe(addDays(from, HORIZON_DAYS - 1));
    expect(forecast!.days).toHaveLength(HORIZON_DAYS);
    expect(forecast!.days[0]).toMatchObject({ condition: "sun", hi: 23, lo: 18 });
    expect(forecast!.days[4].condition).toBe("rain");

    const firstDay = forecast!.hourly[from];
    expect(firstDay.map((p) => p.hour)).toEqual([
      "00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00",
    ]);
    expect(firstDay[4]).toMatchObject({ hour: "12:00", rain: 0.5 });
    expect(forecast!.hourly[addDays(from, 4)].map((p) => p.hour)).toEqual(["00:00", "06:00", "12:00", "18:00"]);
    expect(forecast!.hourly[addDays(from, 4)][0].rain).toBe(2);
  });

  it("shows hours in the place's own time, not MET Norway's UTC", async () => {
    await anchorTrip(world.ours.dayId, { lat: 35.68, lng: 139.69 });
    const from = today();
    stubFetch(metBody(from));

    const forecast = await getTripForecast(world.ours.id);

    expect(forecast!.hourly[addDays(from, 1)][0].hour).toBe("00:00");
    expect(forecast!.hourly[from][0].hour).toBe("09:00");
  });

  it("does not treat an undated, unplaced trip as an error — returns null, no fetch", async () => {
    const fetchMock = stubFetch(metBody(today()));
    expect(await getTripForecast(world.ours.id)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("degrades to null when the provider is unreachable", async () => {
    await anchorTrip(world.ours.dayId);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    await expect(getTripForecast(world.ours.id)).resolves.toBeNull();
  });

  it("degrades to null on a non-OK response", async () => {
    await anchorTrip(world.ours.dayId);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })),
    );
    await expect(getTripForecast(world.ours.id)).resolves.toBeNull();
  });
});
