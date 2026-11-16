import { z } from "zod";

import { router, tripProcedure } from "../trpc";

const memberId = z.object({ userId: z.string().min(1) });

export const rosterRouter = router({
  list: tripProcedure.query(({ ctx }) => ctx.trip.members),

  remove: tripProcedure.input(memberId).mutation(async ({ ctx, input }) => {
    await ctx.port.removeMember(ctx.viewer.id, input.tripId, input.userId);
  }),

  promote: tripProcedure.input(memberId).mutation(async ({ ctx, input }) => {
    await ctx.port.promoteMember(ctx.viewer.id, input.tripId, input.userId);
  }),
});
