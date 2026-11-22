import "server-only";

import { readRoute, routeRequest, type LegLine } from "@floc/core/trip/overview/leg-route";
import type { OverviewRoute } from "@floc/core/trip/overview/route";

import { LIMITS } from "@/server/limits";
import { describeError } from "@/server/observability/describe-error";
import { log } from "@/server/observability/log";

const COMPUTE_ROUTES = "https://routes.googleapis.com/directions/v2:computeRoutes";
const FIELDS = "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline";
const PATIENCE_MS = 5000;

async function askGoogle(key: string, request: object): Promise<LegLine | null> {
  try {
    const res = await fetch(COMPUTE_ROUTES, {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(PATIENCE_MS),
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": FIELDS },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      log.warn("maps.route.failed", { status: res.status });
      return null;
    }
    return readRoute(await res.json());
  } catch (err) {
    log.warn("maps.route.unreachable", describeError(err));
    return null;
  }
}

export async function legRoutes(route: OverviewRoute): Promise<(LegLine | null)[]> {
  const key = process.env.GOOGLE_MAPS_SERVER_KEY?.trim();
  return Promise.all(
    route.moves.map((move, i) => {
      const request = key && i < LIMITS.mapLegs ? routeRequest(route.stops[i], route.stops[i + 1], move.mode) : null;
      return request && key ? askGoogle(key, request) : null;
    }),
  );
}
