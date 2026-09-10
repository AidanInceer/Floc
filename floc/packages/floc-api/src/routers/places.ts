/**
 * The places a trip's days point at (ticket 296).
 *
 * For the map on Overview, and nothing else. This is deliberately NOT the
 * itinerary: a stop is consecutive days sharing an overnight place, derived by
 * `@floc/core/stops` from `itinerary.days`, and there is no `stop` table for
 * this router to be mistaken for (rule 3).
 *
 * What `itinerary.days` cannot give a map is coordinates, so that is the only
 * thing this adds.
 *
 * `search` is the geocoder (ticket 308), for choosing a place before one
 * exists. Signed in but not trip-scoped: the picker runs before a trip is in
 * scope, and `place` rows belong to no trip.
 */
import { z } from "zod";

import { protectedProcedure, router, tripProcedure } from "../trpc";

export const placesRouter = router({
  list: tripProcedure.query(({ ctx, input }) =>
    ctx.port.listPlaces(ctx.viewer.id, input.tripId),
  ),

  /** No hits when the provider is down, never a throw (rule 11). */
  search: protectedProcedure
    .input(z.object({ query: z.string().trim().max(200) }))
    .query(({ ctx, input }) => ctx.port.searchPlaces(ctx.viewer.id, input.query)),
});
