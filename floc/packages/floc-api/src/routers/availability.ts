/**
 * Who can do which days (ticket 297).
 *
 * READ IS THE GROUP'S, WRITE IS YOUR OWN. `list` returns everybody's marks,
 * because the whole point of the Dates screen is seeing where the group
 * overlaps. `set` takes no user id at all: it writes the caller's marks and
 * there is no shape of request that writes somebody else's.
 *
 * That is deliberate and is not an oversight to be fixed later. The four admin
 * powers are invite, kick, promote and delete/archive (rule 6) — answering for
 * another person is not among them, and an admin who could would make the
 * answer worthless.
 *
 * The maths over these rows lives in `@floc/core/availability`, shared with
 * the web app. Nothing is computed here.
 */
import { z } from "zod";

import { router, tripProcedure } from "../trpc";

/** `YYYY-MM-DD`. No timezone and no offset ever crosses this wire (rule 10). */
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.");

/**
 * A year of dates in one call is already far more than a person paints in one
 * gesture; the cap is here so a malformed client cannot ask for a million-row
 * insert, not because anyone will reach it.
 */
const MAX_DATES = 366;

export const availabilityRouter = router({
  list: tripProcedure.query(({ ctx, input }) =>
    ctx.port.listAvailability(ctx.viewer.id, input.tripId),
  ),

  set: tripProcedure
    .input(
      z.object({
        dates: z.array(isoDate).min(1).max(MAX_DATES),
        available: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.port.setAvailability(
        ctx.viewer.id,
        input.tripId,
        input.dates,
        input.available,
      );
    }),
});
