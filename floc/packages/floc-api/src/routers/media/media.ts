import { z } from "zod";

import { router, tripProcedure } from "../../trpc";

export const mediaRouter = router({
  list: tripProcedure.query(({ ctx, input }) => ctx.port.listTripMedia(ctx.viewer.id, input.tripId)),

  remove: tripProcedure
    .input(z.object({ mediaId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.deleteTripMedia(ctx.viewer.id, input.tripId, input.mediaId);
    }),
});
