import { TEXT_CAPS } from "@floc/core/text/text";
import { isIsoDate } from "@floc/core/dates/dates";
import { GROUP_CAP, TRIP_INVITE_CAP } from "@floc/core/people/group-ticks";
import { NO_TRIP_NAME, TRIP_NAME_TOO_LONG } from "@floc/core/trip/trip-name";
import { z } from "zod";

import { protectedProcedure, router, tripProcedure } from "../trpc";

const isoDate = z.string().refine(isIsoDate, "Use a real YYYY-MM-DD date.");
const optionalDate = isoDate.nullable();

const tripName = z.string().trim().min(1, NO_TRIP_NAME).max(TEXT_CAPS.tripName, TRIP_NAME_TOO_LONG);

export const tripsRouter = router({
  list: protectedProcedure
    .input(z.object({ archived: z.boolean().default(false) }).default({ archived: false }))
    .query(({ ctx, input }) => ctx.port.listTrips(ctx.viewer.id, input)),

  get: tripProcedure.query(({ ctx }) => ctx.trip),

  create: protectedProcedure
    .input(
      z.object({
        name: tripName,
        startDate: optionalDate.default(null),
        endDate: optionalDate.default(null),
        friendIds: z.array(z.string().min(1).max(64)).max(TRIP_INVITE_CAP).optional(),
        groupIds: z.array(z.number().int().positive()).max(GROUP_CAP).optional(),
      }),
    )
    .mutation(({ ctx, input }) => ctx.port.createTrip(ctx.viewer.id, input)),

  startFromPreset: protectedProcedure
    .input(
      z.object({
        presetId: z.string().min(1),
        month: z.number().int().min(1).max(12).nullable().default(null),
        startDate: optionalDate.default(null),
        ideas: z.boolean().default(true),
        events: z.boolean().default(true),
        friendIds: z.array(z.string().min(1).max(64)).max(TRIP_INVITE_CAP).default([]),
      }),
    )
    .mutation(({ ctx, input: { friendIds, ...choice } }) => ctx.port.startTripFromPreset(ctx.viewer.id, choice, friendIds)),

  update: tripProcedure
    .input(
      z.object({
        name: tripName.optional(),
        startDate: optionalDate.optional(),
        endDate: optionalDate.optional(),
        colorKey: z.string().nullable().optional(),
        mark: z.string().nullable().optional(),
        tags: z.array(z.string()).nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tripId, ...patch } = input;
      await ctx.port.updateTrip(ctx.viewer.id, tripId, patch);
    }),

  setStarred: tripProcedure
    .input(z.object({ starred: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.setTripStarred(ctx.viewer.id, input.tripId, input.starred);
    }),

  setMuted: tripProcedure
    .input(z.object({ muted: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.setTripMuted(ctx.viewer.id, input.tripId, input.muted);
    }),

  setArchived: tripProcedure
    .input(z.object({ archived: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.archiveTrip(ctx.viewer.id, input.tripId, input.archived);
    }),

  delete: tripProcedure.mutation(async ({ ctx, input }) => {
    await ctx.port.deleteTrip(ctx.viewer.id, input.tripId);
  }),

  leave: tripProcedure.mutation(async ({ ctx, input }) => {
    await ctx.port.leaveTrip(ctx.viewer.id, input.tripId);
  }),

  join: protectedProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(({ ctx, input }) => ctx.port.joinByToken(ctx.viewer.id, input.token)),
});
