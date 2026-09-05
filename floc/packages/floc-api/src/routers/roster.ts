/**
 * The roster, and the admin powers over it (tickets 287, 291).
 *
 * EXACTLY FOUR ADMIN POWERS (rule 6): invite, kick, promote, delete/archive.
 * Two of them live here; archive is on the trips router beside the trip it
 * changes, and invite is still web-only (the phone has no mail composer of its
 * own). Everything else — including leaving — is any member's, which is why
 * `trips.leave` is not in this file.
 *
 * The gate itself is the port's, not this router's: a phone must not be able
 * to authorise itself by asking nicely.
 */
import { z } from "zod";

import { router, tripProcedure } from "../trpc";

const memberId = z.object({ userId: z.string().min(1) });

export const rosterRouter = router({
  /** Already loaded by `tripProcedure`, so this is free — it exists so a client can refetch the roster alone. */
  list: tripProcedure.query(({ ctx }) => ctx.trip.members),

  remove: tripProcedure.input(memberId).mutation(async ({ ctx, input }) => {
    await ctx.port.removeMember(ctx.viewer.id, input.tripId, input.userId);
  }),

  promote: tripProcedure.input(memberId).mutation(async ({ ctx, input }) => {
    await ctx.port.promoteMember(ctx.viewer.id, input.tripId, input.userId);
  }),
});
