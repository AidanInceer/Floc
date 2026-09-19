/**
 * Being asked onto a trip, and asking somebody (tickets 05, 146).
 *
 * TWO DOORS, ONE ROUTER. The forwardable share link and the named invite are
 * different objects — a link is a secret anyone may hold, an invite is a row
 * addressed to one person — but they answer the same question for whoever is
 * looking at them, so they are read from one place.
 *
 * `preview` IS PUBLIC ON PURPOSE. The whole point of a share link is that it
 * works before you are anybody: the phone shows the trip's name and dates on
 * the sign-in screen's other side. It carries no roster, no money and no notes,
 * so there is nothing in it a member has that a holder should not.
 */
import { z } from "zod";

import { protectedProcedure, publicProcedure, router, tripProcedure } from "../trpc";

const tripOnly = z.object({ tripId: z.number().int().positive() });

export const invitesRouter = router({
  /** The link, who has been asked, and who is left to ask. Any member (#312). */
  forTrip: tripProcedure.query(({ ctx, input }) =>
    ctx.port.loadTripInvites(ctx.viewer.id, input.tripId),
  ),

  /** Anyone already on the roster is dropped, not refused — an ordinary mistake. */
  send: tripProcedure
    .input(z.object({ userIds: z.array(z.string().min(1)).min(1).max(20) }))
    .mutation(({ ctx, input }) =>
      ctx.port.inviteToTrip(ctx.viewer.id, input.tripId, input.userIds),
    ),

  /** Trips the viewer has been asked onto and not answered. Empty is ordinary. */
  mine: protectedProcedure.query(({ ctx }) => ctx.port.listMyInvites(ctx.viewer.id)),

  accept: protectedProcedure.input(tripOnly).mutation(async ({ ctx, input }) => {
    await ctx.port.acceptTripInvite(ctx.viewer.id, input.tripId);
  }),

  decline: protectedProcedure.input(tripOnly).mutation(async ({ ctx, input }) => {
    await ctx.port.declineTripInvite(ctx.viewer.id, input.tripId);
  }),

  /**
   * Re-locks the trip and answers the new token (#358). Admin-only, enforced by
   * the port (rule 6) — unlike `forTrip` and `send`, which any member may call.
   */
  resetLink: tripProcedure.mutation(({ ctx, input }) =>
    ctx.port.resetInviteLink(ctx.viewer.id, input.tripId),
  ),

  /** Null for a bad or retired token — never an error naming what was wrong. */
  preview: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(({ ctx, input }) => ctx.port.previewInvite(input.token)),
});
