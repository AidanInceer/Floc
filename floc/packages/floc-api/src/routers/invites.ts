import { z } from "zod";

import { protectedProcedure, publicProcedure, router, tripProcedure } from "../trpc";

const tripOnly = z.object({ tripId: z.number().int().positive() });

export const invitesRouter = router({
  forTrip: tripProcedure.query(({ ctx, input }) =>
    ctx.port.loadTripInvites(ctx.viewer.id, input.tripId),
  ),

  send: tripProcedure
    .input(z.object({ userIds: z.array(z.string().min(1)).min(1).max(20) }))
    .mutation(({ ctx, input }) =>
      ctx.port.inviteToTrip(ctx.viewer.id, input.tripId, input.userIds),
    ),

  mine: protectedProcedure.query(({ ctx }) => ctx.port.listMyInvites(ctx.viewer.id)),

  accept: protectedProcedure.input(tripOnly).mutation(async ({ ctx, input }) => {
    await ctx.port.acceptTripInvite(ctx.viewer.id, input.tripId);
  }),

  decline: protectedProcedure.input(tripOnly).mutation(async ({ ctx, input }) => {
    await ctx.port.declineTripInvite(ctx.viewer.id, input.tripId);
  }),

  resetLink: tripProcedure.mutation(({ ctx, input }) =>
    ctx.port.resetInviteLink(ctx.viewer.id, input.tripId),
  ),

  preview: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(({ ctx, input }) => ctx.port.previewInvite(input.token)),
});
