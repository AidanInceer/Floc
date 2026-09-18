/**
 * Trips: the list, one trip, creating, renaming, archiving, joining, leaving
 * (#287, #291, #312).
 *
 * Writes go through the port, which is the web app's own `server/` modules —
 * so a phone and a browser share one implementation of every rule, including
 * the three admin powers (rule 6) and soft delete (rule 8). None of that is
 * restated here; restating it is how two clients drift apart.
 */
import { z } from "zod";

import { protectedProcedure, router, tripProcedure } from "../trpc";

/** `YYYY-MM-DD` or nothing. A trip may have no dates and that is never an error (rule 9). */
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.");
const optionalDate = isoDate.nullable();

const tripName = z.string().trim().min(1, "Give the trip a name.").max(120);

export const tripsRouter = router({
  list: protectedProcedure
    .input(z.object({ archived: z.boolean().default(false) }).default({ archived: false }))
    .query(({ ctx, input }) => ctx.port.listTrips(ctx.viewer.id, input)),

  /** The trip plus its roster — everything a client needs before rendering any tab. */
  get: tripProcedure.query(({ ctx }) => ctx.trip),

  create: protectedProcedure
    .input(
      z.object({
        name: tripName,
        startDate: optionalDate.default(null),
        endDate: optionalDate.default(null),
      }),
    )
    .mutation(({ ctx, input }) => ctx.port.createTrip(ctx.viewer.id, input)),

  /**
   * Starts a trip from an Explore listing. The listing itself is static data in
   * `@floc/core/preset-trips`, which both clients read directly — only the
   * writing needs a server, so only the writing is here.
   */
  startFromPreset: protectedProcedure
    .input(z.object({ presetId: z.string().min(1) }))
    .mutation(({ ctx, input }) =>
      ctx.port.startTripFromPreset(ctx.viewer.id, input.presetId),
    ),

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

  /** Admin-only, enforced by the port (rule 6). */
  setArchived: tripProcedure
    .input(z.object({ archived: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.archiveTrip(ctx.viewer.id, input.tripId, input.archived);
    }),

  /**
   * Admin-only, any stage, no undo (rule 6). A soft delete, so the rows stay
   * for an operator — but nothing in either client ever offers them again.
   */
  delete: tripProcedure.mutation(async ({ ctx, input }) => {
    await ctx.port.deleteTrip(ctx.viewer.id, input.tripId);
  }),

  /** Leaving is not an admin power — any member may (rule 6). */
  leave: tripProcedure.mutation(async ({ ctx, input }) => {
    await ctx.port.leaveTrip(ctx.viewer.id, input.tripId);
  }),

  /**
   * Join by the trip's unguessable share token, never by its id (ticket 05).
   * A bad token answers null rather than an error naming what was wrong.
   */
  join: protectedProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(({ ctx, input }) => ctx.port.joinByToken(ctx.viewer.id, input.token)),
});
