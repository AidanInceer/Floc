import { isIsoDate } from "@floc/core/dates/dates";
import { TRIP_LENGTHS } from "@floc/core/dates/finding/trip-length";
import { z } from "zod";

import { protectedProcedure, router, tripProcedure } from "../../trpc";

const isoDate = z.string().refine(isIsoDate, "Use a real YYYY-MM-DD date.");

const MAX_DATES = 366;

export const availabilityRouter = router({
  calendar: protectedProcedure.query(({ ctx }) => ctx.port.calendarAccess(ctx.viewer.id)),

  fillFromCalendar: tripProcedure
    .input(z.object({ month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use a month like 2027-09.") }))
    .mutation(({ ctx, input }) => ctx.port.fillFromCalendar(ctx.viewer.id, input.tripId, input.month)),

  setCalendarAllDayOnly: protectedProcedure
    .input(z.object({ on: z.boolean() }))
    .mutation(({ ctx, input }) => ctx.port.setCalendarAllDayOnly(ctx.viewer.id, input.on)),

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

  prefer: tripProcedure
    .input(
      z.object({
        dates: z.array(isoDate).min(1).max(MAX_DATES),
        preferred: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.port.setPreferredDays(ctx.viewer.id, input.tripId, input.dates, input.preferred);
    }),

  lengths: tripProcedure.query(({ ctx, input }) => ctx.port.listLengthChoices(ctx.viewer.id, input.tripId)),

  setLength: tripProcedure
    .input(z.object({ length: z.enum(TRIP_LENGTHS), picked: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.setLengthChoice(ctx.viewer.id, input.tripId, input.length, input.picked);
    }),
});
