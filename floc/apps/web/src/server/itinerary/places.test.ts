/** Place search: cached, never caching a failure, and one person cannot hold the queue. */
import { afterEach, describe, expect, it, vi } from "vitest";

import { searchPlaces } from "@/server/itinerary/places";

const porto = [{ osm_type: "relation", osm_id: 1, name: "Porto", display_name: "Porto, Portugal", lat: "41.1", lon: "-8.6" }];

function answer(body: unknown, ok = true) {
  const fetchMock = vi.fn(async () => ({ ok, status: ok ? 200 : 503, json: async () => body }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

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
});
