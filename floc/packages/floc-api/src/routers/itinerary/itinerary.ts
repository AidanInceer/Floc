import { isIsoDate } from "@floc/core/dates/dates";
import { DAY_EVENT_TYPES, TRANSPORT_TYPES } from "@floc/core/vocabulary";
import { z } from "zod";

import { router, tripProcedure } from "../../trpc";

const clockTime = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a 24-hour HH:MM time.")
  .nullable();

const isoDate = z.string().refine(isIsoDate, "Use a YYYY-MM-DD date.");

const overnightPlace = z
  .union([
    z.object({ placeId: z.number().int().positive() }),
    z.object({
      name: z.string().trim().min(1, "Name the place.").max(200),
      providerId: z.string().nullable().default(null),
      lat: z.number().nullable().default(null),
      lng: z.number().nullable().default(null),
      countryCode: z.string().length(2).nullable().default(null),
    }),
  ])
  .nullable();

const eventFields = z.object({
  type: z.enum(DAY_EVENT_TYPES),
  title: z.string().trim().min(1, "Give the event a name.").max(200),
  transportType: z.enum(TRANSPORT_TYPES).nullable().default(null),
  time: clockTime.default(null),
  endTime: clockTime.default(null),
  allDay: z.boolean().default(false),
  note: z.string().max(2000).nullable().default(null),
});

export const itineraryRouter = router({
  days: tripProcedure.query(({ ctx, input }) =>
    ctx.port.listDays(ctx.viewer.id, input.tripId),
  ),

  calendarUrl: tripProcedure.query(({ ctx, input }) =>
    ctx.port.calendarFeedUrl(ctx.viewer.id, input.tripId),
  ),

  resetCalendarUrl: tripProcedure.mutation(({ ctx, input }) =>
    ctx.port.resetCalendarFeed(ctx.viewer.id, input.tripId),
  ),

  forecast: tripProcedure.query(({ ctx, input }) =>
    ctx.port.loadTripForecast(ctx.viewer.id, input.tripId),
  ),

  addEvent: tripProcedure
    .input(z.object({ dayId: z.number().int().positive(), event: eventFields }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.addEvent(ctx.viewer.id, input.tripId, input.dayId, input.event);
    }),

  updateEvent: tripProcedure
    .input(z.object({ eventId: z.number().int().positive(), event: eventFields }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.updateEvent(ctx.viewer.id, input.tripId, input.eventId, input.event);
    }),

  setOvernight: tripProcedure
    .input(z.object({ startDate: isoDate, endDate: isoDate, place: overnightPlace }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.setOvernight(ctx.viewer.id, input.tripId, {
        startDate: input.startDate,
        endDate: input.endDate,
        place: input.place,
      });
    }),

  deleteEvent: tripProcedure
    .input(z.object({ eventId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.deleteEvent(ctx.viewer.id, input.tripId, input.eventId);
    }),
});
