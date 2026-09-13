/**
 * The itinerary — days, and the events on them (tickets 287, 291).
 *
 * DAY-FIRST, ALWAYS (rule 3). There is no `stop` procedure here and there must
 * never be one: a stop is consecutive days sharing an overnight place, derived
 * by `@floc/core/stops` on whichever client is drawing it. Both platforms
 * derive it with the same function, so neither invents its own idea of one.
 */
import { isIsoDate } from "@floc/core/dates/dates";
import { DAY_EVENT_TYPES, TRANSPORT_TYPES } from "@floc/core/vocabulary";
import { z } from "zod";

import { router, tripProcedure } from "../trpc";

/** `HH:MM`, local to the itinerary. Never an offset — the app has no timezones (rule 10). */
const clockTime = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a 24-hour HH:MM time.")
  .nullable();

/** `YYYY-MM-DD`, never a timestamp — the app has no timezones (rule 10). */
const isoDate = z.string().refine(isIsoDate, "Use a YYYY-MM-DD date.");

/**
 * Either a place the trip already points at, or a fresh pick. Null clears.
 * A typed name with no provider id is valid: the geocoder being down must
 * still leave a way to say where the group is sleeping (rule 11).
 */
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
  /** Every day in date order with its events attached. One call renders the whole tab. */
  days: tripProcedure.query(({ ctx, input }) =>
    ctx.port.listDays(ctx.viewer.id, input.tripId),
  ),

  calendarUrl: tripProcedure.query(({ ctx, input }) =>
    ctx.port.calendarFeedUrl(ctx.viewer.id, input.tripId),
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

  /**
   * Where the group sleeps, over a run of days. NOT a stop (rule 3) — this
   * writes `overnight_place_id` on each day in the span and nothing else.
   */
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
