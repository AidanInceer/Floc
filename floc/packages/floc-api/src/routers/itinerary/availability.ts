/**
 * Who can do which days (#297). The maths lives in `@floc/core/availability`, shared with the web.
 *
 * Why: read is the group's, write is your own. `set` takes no user id, so no shape of request
 * writes somebody else's marks — answering for another person is not an admin power (rule 6), and
 * an admin who could would make the answer worthless.
 */
import { isIsoDate } from "@floc/core/dates/dates";
import { z } from "zod";

import { protectedProcedure, router, tripProcedure } from "../../trpc";

// `YYYY-MM-DD`. No timezone and no offset ever crosses this wire (rule 10).
const isoDate = z.string().refine(isIsoDate, "Use a real YYYY-MM-DD date.");

// Why: a cap against a malformed client asking for a million-row insert, not a limit anyone
// paints into.
const MAX_DATES = 366;

export const availabilityRouter = router({
  /** Whether to draw the calendar import at all (#444). No Google key: it never shows (rule 11). */
  calendar: protectedProcedure.query(({ ctx }) => ctx.port.calendarAccess(ctx.viewer.id)),

  /**
   * One read of the viewer's primary Google calendar, on their tap (#444, ADR-031). A refusal comes
   * back as a result for the form, not an error. `needs-access` sends the phone to Google's consent.
   */
  fillFromCalendar: tripProcedure
    .input(z.object({ month: z.string().regex(/^d{4}-(0[1-9]|1[0-2])$/, "Use a month like 2027-09.") }))
    .mutation(({ ctx, input }) => ctx.port.fillFromCalendar(ctx.viewer.id, input.tripId, input.month)),

  list: tripProcedure.query(({ ctx, input }) =>
    ctx.port.listAvailability(ctx.viewer.id, input.tripId),
  ),

  guests: tripProcedure.query(({ ctx, input }) => ctx.port.listTripGuests(ctx.viewer.id, input.tripId)),

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
