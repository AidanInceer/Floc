/** The route-tracking half of the port (#329, ADR-026). The web shows routes; only the phone records. */
import type { Position } from "@floc/core/trip/route/route-track";

export type { Position };

export type GroupRoute = {
  userId: string;
  name: string;
  tone: string;
  /** [lng, lat] in time order. */
  path: [number, number][];
  /** Null outside the trip's dates. `recordedAt` is epoch ms, an instant, not an itinerary time. */
  live: { lat: number; lng: number; recordedAt: number } | null;
};

export type RoutePort = {
  /** Whether the viewer records their route on this trip. */
  routeOn(viewerId: string, tripId: number): Promise<boolean>;
  setRouteOn(viewerId: string, tripId: number, on: boolean): Promise<void>;
  /** How many were new. Off, or a day outside the trip, keeps nothing. */
  recordPositions(viewerId: string, tripId: number, positions: Position[]): Promise<number>;
  /** `today` is the caller's own day: it decides only whether the live dots show. */
  groupRoutes(viewerId: string, tripId: number, today: string): Promise<GroupRoute[]>;
  /** For good, for everyone. */
  deleteMyRoute(viewerId: string, tripId: number): Promise<void>;
};
