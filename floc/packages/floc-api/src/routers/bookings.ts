/**
 * Your Bookings area (#559): forwarded or uploaded files that wait for you to choose a trip.
 *
 * NOT A TRIP SURFACE, SO NOT A `tripProcedure`. A waiting file belongs to a person. The host scopes every
 * read and write to the viewer, and `place` resolves the trip against the viewer's own memberships, so no
 * request can name somebody else's file or a trip the viewer is not on.
 *
 * REFUSALS COME BACK AS WORDS, NOT THROWS, as in `files`.
 */
import { MAX_DOCUMENT_BASE64_LENGTH } from "@floc/core/documents/documents";
import { z } from "zod";

import { protectedProcedure, router } from "../trpc";

const fileId = z.number().int().positive();

export const bookingsRouter = router({
  area: protectedProcedure.query(({ ctx }) => ctx.port.bookingsArea(ctx.viewer.id)),

  waitingCount: protectedProcedure.query(({ ctx }) => ctx.port.waitingBookingCount(ctx.viewer.id)),

  upload: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(200),
        mimeType: z.string().min(1).max(120),
        contentBase64: z.string().min(1).max(MAX_DOCUMENT_BASE64_LENGTH, "Files are capped at 8 MB"),
      }),
    )
    .mutation(({ ctx, input }) => ctx.port.uploadWaitingBooking(ctx.viewer.id, input)),

  place: protectedProcedure
    .input(z.object({ fileId, tripId: z.number().int().positive() }))
    .mutation(({ ctx, input }) => ctx.port.placeWaitingBooking(ctx.viewer.id, input.fileId, input.tripId)),

  remove: protectedProcedure.input(z.object({ fileId })).mutation(async ({ ctx, input }) => {
    await ctx.port.removeWaitingBooking(ctx.viewer.id, input.fileId);
  }),
});
