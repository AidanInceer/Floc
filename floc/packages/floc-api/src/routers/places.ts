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
 */
import { router, tripProcedure } from "../trpc";

export const placesRouter = router({
  list: tripProcedure.query(({ ctx, input }) =>
    ctx.port.listPlaces(ctx.viewer.id, input.tripId),
  ),
});
