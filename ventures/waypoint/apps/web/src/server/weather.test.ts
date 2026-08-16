import { eq } from "drizzle-orm";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { db, schema } from "@/db";
import { getTripForecast, tripForecastAnchor } from "@/server/weather";
import { addDays, today } from "@/lib/dates";
import { HORIZON_DAYS } from "@/lib/weather";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";

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

/** Gives the trip's seeded day a place with coordinates — an anchor to forecast. */
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

/** A well-formed Open-Meteo response for the horizon, rain on the 5th day. */
function meteoBody(from: string, days = HORIZON_DAYS) {
  const daily = {
    time: [] as string[],
    weather_code: [] as number[],
    temperature_2m_max: [] as number[],
    temperature_2m_min: [] as number[],
  };
  for (let i = 0; i < days; i++) {
    daily.time.push(addDays(from, i));
    daily.weather_code.push(i === 4 ? 61 : 0);
    daily.temperature_2m_max.push(25 + (i % 3));
    daily.temperature_2m_min.push(15 + (i % 3));
  }
  const hourly = {
    time: [] as string[],
    temperature_2m: [] as number[],
    weather_code: [] as number[],
    precipitation_probability: [] as number[],
  };
  for (let h = 0; h < 24; h++) {
    hourly.time.push(`${from}T${String(h).padStart(2, "0")}:00`);
    hourly.temperature_2m.push(18 + (h % 6));
    hourly.weather_code.push(0);
    hourly.precipitation_probability.push(h === 12 ? 70 : 0);
  }
  return { daily, hourly };
}

function stubFetch(body: unknown) {
  const fn = vi.fn(async () => ({ ok: true, json: async () => body }));
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("tripForecastAnchor", () => {
  it("returns null when no day points at a place with coordinates", async () => {
    // The seeded day has no overnight place at all.
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
  it("bounds the request to the honest horizon and maps the days", async () => {
    await anchorTrip(world.ours.dayId);
    const from = today();
    const fetchMock = stubFetch(meteoBody(from));

    const forecast = await getTripForecast(world.ours.id);

    expect(forecast).not.toBeNull();
    // The request itself carries the 14-day bound and the place.
    const calledUrl = String((fetchMock.mock.calls[0] as unknown[])[0]);
    expect(calledUrl).toContain(`forecast_days=${HORIZON_DAYS}`);
    expect(calledUrl).toContain("latitude=38.7200");

    expect(forecast!.placeName).toBe("Lisbon");
    expect(forecast!.from).toBe(from);
    // The last day with data is from + 13, not a guessed 15th day.
    expect(forecast!.horizonEnd).toBe(addDays(from, HORIZON_DAYS - 1));
    expect(forecast!.days).toHaveLength(HORIZON_DAYS);
    expect(forecast!.days[4].condition).toBe("rain");

    // Hourly is thinned to every third hour — eight points, 12:00 wet.
    const firstDay = forecast!.hourly[from];
    expect(firstDay).toHaveLength(8);
    expect(firstDay.map((p) => p.hour)).toEqual([
      "00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00",
    ]);
    expect(firstDay[4]).toMatchObject({ hour: "12:00", pop: 70 });
  });

  it("does not treat an undated, unplaced trip as an error — returns null, no fetch", async () => {
    const fetchMock = stubFetch(meteoBody(today()));
    // world.ours has no dates and no placed location.
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
