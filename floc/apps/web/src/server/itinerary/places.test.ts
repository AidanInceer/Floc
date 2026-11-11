/** Place search: cached, never caching a failure, and one person cannot hold the queue. */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { db, schema } from "@/db";
import { searchPlaces, upsertPlace } from "@/server/itinerary/places";
import { capturedLogAsync } from "@/test/captured-log";
import { migrateTestDb, resetDb } from "@/test/db";

const porto = [{ osm_type: "relation", osm_id: 1, name: "Porto", display_name: "Porto, Portugal", lat: "41.1", lon: "-8.6" }];

function answer(body: unknown, ok = true) {
  const fetchMock = vi.fn(async () => ({ ok, status: ok ? 200 : 503, json: async () => body }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeAll(migrateTestDb);
beforeEach(resetDb);
afterEach(() => vi.unstubAllGlobals());

describe("searching for a place", () => {
  it("asks the provider once for the same words", async () => {
    const fetchMock = answer(porto);
    expect((await searchPlaces("Porto"))[0].name).toBe("Porto");
    expect((await searchPlaces("  porto "))[0].name).toBe("Porto");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not remember a failed answer", async () => {
    answer({}, false);
    expect(await searchPlaces("Lagos")).toEqual([]);
    const fetchMock = answer(porto);
    expect(await searchPlaces("Lagos")).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("answers nothing at once when one person already has two searches waiting", async () => {
    answer(porto);
    const first = searchPlaces("Braga", "ada");
    const second = searchPlaces("Faro", "ada");
    expect(await searchPlaces("Evora", "ada")).toEqual([]);
    await Promise.all([first, second]);
  });

  it("answers nothing and logs it when the provider cannot be reached", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("fetch failed"); }));
    const { result, lines } = await capturedLogAsync(() => searchPlaces("Sintra"));
    expect(result).toEqual([]);
    expect(lines).toEqual([expect.objectContaining({ message: "geocoding.unreachable", errorType: "TypeError" })]);
  });
});

describe("a long search", () => {
  it("sends the provider no more than a place name's length", async () => {
    const fetchMock = answer(porto);
    await searchPlaces("Porto ".repeat(2000));
    const sent = new URL(String((fetchMock.mock.calls[0] as unknown[])[0])).searchParams.get("q") ?? "";
    expect(sent.length).toBeLessThanOrEqual(200);
  });
});

describe("a typed place name", () => {
  const typed = (name: string) => upsertPlace({ providerId: null, name });
  const placeRows = async () => (await db.select({ id: schema.place.id }).from(schema.place).all()).length;

  it("reuses one row when the same name is saved again, so an autosave does not pile up places", async () => {
    expect(await typed("Nan's flat")).toBe(await typed("Nan's flat"));
    expect(await placeRows()).toBe(1);
  });

  it("gets its own row for a different name", async () => {
    expect(await typed("Nan's flat")).not.toBe(await typed("The cabin"));
  });

  it("never borrows a picked place that happens to share its name", async () => {
    const picked = await upsertPlace({ providerId: "osm:relation:1", name: "Porto", lat: 41.1, lng: -8.6 });
    expect(await typed("Porto")).not.toBe(picked);
  });
});
