/**
 * Route tracking (#329, ADR-026). Each member switches it on for themselves; the phone then sends
 * positions in batches, so a day offline uploads in one call when the signal comes back.
 */
import { isIsoDate } from "@floc/core/dates/dates";
import { MAX_BATCH } from "@floc/core/trip/route/route-track";
import { z } from "zod";

import { router, tripProcedure } from "../../trpc";

const isoDate = z.string().refine(isIsoDate, "Use a YYYY-MM-DD date.");
const position = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  date: isoDate,
  recordedAt: z.number().int().positive(),
});

export const routeRouter = router({
  on: tripProcedure.query(({ ctx, input }) => ctx.port.routeOn(ctx.viewer.id, input.tripId)),

  setOn: tripProcedure
    .input(z.object({ on: z.boolean() }))
    .mutation(({ ctx, input }) => ctx.port.setRouteOn(ctx.viewer.id, input.tripId, input.on)),

  record: tripProcedure
    .input(z.object({ positions: z.array(position).min(1).max(MAX_BATCH) }))
    .mutation(({ ctx, input }) => ctx.port.recordPositions(ctx.viewer.id, input.tripId, input.positions)),

  group: tripProcedure
    .input(z.object({ today: isoDate }))
    .query(({ ctx, input }) => ctx.port.groupRoutes(ctx.viewer.id, input.tripId, input.today)),

  deleteMine: tripProcedure.mutation(({ ctx, input }) => ctx.port.deleteMyRoute(ctx.viewer.id, input.tripId)),
});
