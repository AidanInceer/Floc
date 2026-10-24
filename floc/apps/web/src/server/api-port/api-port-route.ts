import "server-only";

import type { FlocPort } from "@floc/api/port";

import { scoped } from "@/server/api-port/api-port-scope";
import { groupRoutes } from "@/server/route/group-routes";
import { deleteMyRoute, recordPositions } from "@/server/route/route-positions";
import { routeOn, setRouteOn } from "@/server/route/route-switch";

type RoutePort = Pick<FlocPort, "routeOn" | "setRouteOn" | "recordPositions" | "groupRoutes" | "deleteMyRoute">;

export const routePort: RoutePort = {
  routeOn: async (viewerId, tripId) => routeOn(await scoped(viewerId, tripId)),
  setRouteOn: async (viewerId, tripId, on) => setRouteOn(await scoped(viewerId, tripId), on),
  recordPositions: async (viewerId, tripId, positions) => recordPositions(await scoped(viewerId, tripId), positions, Date.now()),
  groupRoutes: async (viewerId, tripId, today) => groupRoutes(await scoped(viewerId, tripId), today),
  deleteMyRoute: async (viewerId, tripId) => deleteMyRoute(await scoped(viewerId, tripId)),
};
