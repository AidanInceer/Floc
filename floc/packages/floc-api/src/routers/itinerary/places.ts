import { z } from "zod";

import { protectedProcedure, router, tripProcedure } from "../../trpc";

export const placesRouter = router({
  list: tripProcedure.query(({ ctx, input }) =>
    ctx.port.listPlaces(ctx.viewer.id, input.tripId),
  ),

  search: protectedProcedure
    .input(z.object({ query: z.string().trim().max(200) }))
    .query(({ ctx, input }) => ctx.port.searchPlaces(ctx.viewer.id, input.query)),
});
