import { afterEach, describe, expect, it, vi } from "vitest";

import type { OverviewRoute } from "@floc/core/trip/overview/route";
import { LIMITS } from "@/server/limits";
import { legRoutes } from "@/server/maps/leg-routes";

const LISBON = { place: "Lisbon", lat: 38.72, lng: -9.14, nights: 3 };
const SEVILLE = { place: "Seville", lat: 37.39, lng: -5.98, nights: 4 };

const route = (modes: OverviewRoute["moves"][number]["mode"][]): OverviewRoute => ({
  stops: [LISBON, ...modes.map(() => SEVILLE)],
  moves: modes.map((mode) => ({ mode, time: "" })),
  countries: [],
  uncoded: [],
  missing: [],
});

const answer = (status = 200) =>
  new Response(JSON.stringify({ routes: [{ duration: "18180s", distanceMeters: 463012, polyline: { encodedPolyline: "_p~iF~ps|U" } }] }), { status });

function google(reply: () => Promise<Response>) {
  const fetcher = vi.fn(reply);
  vi.stubGlobal("fetch", fetcher);
  return fetcher;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("legRoutes", () => {
  it("asks Google nothing without a server key, and every hop has no line (rule 11)", async () => {
    vi.stubEnv("GOOGLE_MAPS_SERVER_KEY", "");
    const fetcher = google(async () => answer());
    expect(await legRoutes(route(["car", "train"]))).toEqual([null, null]);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("asks for each road or rail hop with the key and only the three fields it reads", async () => {
    vi.stubEnv("GOOGLE_MAPS_SERVER_KEY", "server-key");
    const fetcher = google(async () => answer());
    expect(await legRoutes(route(["car"]))).toEqual([{ path: "_p~iF~ps|U", seconds: 18180, metres: 463012 }]);

    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://routes.googleapis.com/directions/v2:computeRoutes");
    expect(init.method).toBe("POST");
    expect(init.cache).toBe("no-store");
    expect(init.headers).toMatchObject({
      "X-Goog-Api-Key": "server-key",
      "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
    });
    expect(JSON.parse(String(init.body))).toMatchObject({ travelMode: "DRIVE" });
  });

  it("asks nothing for a flight", async () => {
    vi.stubEnv("GOOGLE_MAPS_SERVER_KEY", "server-key");
    const fetcher = google(async () => answer());
    expect(await legRoutes(route(["flight"]))).toEqual([null]);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("gives a hop no line when Google refuses or cannot be reached (rule 11)", async () => {
    vi.stubEnv("GOOGLE_MAPS_SERVER_KEY", "server-key");
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    google(async () => answer(403));
    expect(await legRoutes(route(["car"]))).toEqual([null]);
    google(async () => {
      throw new Error("offline");
    });
    expect(await legRoutes(route(["car"]))).toEqual([null]);
  });

  it("stops asking past the cap on hops for one map", async () => {
    vi.stubEnv("GOOGLE_MAPS_SERVER_KEY", "server-key");
    const fetcher = google(async () => answer());
    const lines = await legRoutes(route(Array.from({ length: LIMITS.mapLegs + 3 }, () => "car" as const)));
    expect(fetcher).toHaveBeenCalledTimes(LIMITS.mapLegs);
    expect(lines).toHaveLength(LIMITS.mapLegs + 3);
    expect(lines.slice(LIMITS.mapLegs)).toEqual([null, null, null]);
  });
});
