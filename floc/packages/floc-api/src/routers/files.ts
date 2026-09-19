/**
 * The trip's files (#239, #296).
 *
 * The private/shared line is the port's to draw, not this router's. A viewer
 * id goes down with every call and the implementation filters on it, so there
 * is no shape of request that returns somebody else's private file.
 *
 * UPLOADING IS BASE64, NOT MULTIPART. A phone has no form to post and the cap
 * is 8 MB either way, so the wire carries a third more than the file on a rare
 * action — cheaper than a second upload endpoint with its own auth to get wrong.
 *
 * REFUSALS COME BACK AS WORDS, NOT THROWS. A full trip and an unsupported type
 * are ordinary mistakes; `upload` answers with the sentence a form shows, and
 * null when the file landed.
 */
import { DOC_CATEGORIES, MAX_DOCUMENT_BASE64_LENGTH } from "@floc/core/documents/documents";
import { z } from "zod";

import { router, tripProcedure } from "../trpc";

const category = z.enum(DOC_CATEGORIES);

export const filesRouter = router({
  list: tripProcedure.query(({ ctx, input }) =>
    ctx.port.listFiles(ctx.viewer.id, input.tripId),
  ),

  /** False means no volume is mounted — the client hides the upload rather than offering one that throws (rule 11). */
  canUpload: tripProcedure.query(({ ctx }) => ctx.port.filesWritable()),

  upload: tripProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(200),
        mimeType: z.string().min(1).max(120),
        contentBase64: z.string().min(1).max(MAX_DOCUMENT_BASE64_LENGTH, "Files are capped at 8 MB"),
        category,
        shared: z.boolean(),
        /** Set when it was added from an event's modal (ticket 325). */
        dayEventId: z.number().int().positive().nullable().default(null),
      }),
    )
    .mutation(({ ctx, input }) => {
      const { tripId, ...file } = input;
      return ctx.port.uploadFile(ctx.viewer.id, tripId, file);
    }),

  /**
   * Where to send a browser to look at the file (#325 feedback). A query, not a
   * field on `list`: the link expires, so it is minted when it is about to be
   * used rather than for every row of a list nobody may tap.
   */
  viewUrl: tripProcedure
    .input(z.object({ fileId: z.number().int().positive() }))
    .query(({ ctx, input }) => ctx.port.fileViewUrl(ctx.viewer.id, input.tripId, input.fileId)),

  /** Any member's to do — the resolver already refused what they cannot see. */
  remove: tripProcedure
    .input(z.object({ fileId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.deleteFile(ctx.viewer.id, input.tripId, input.fileId);
    }),

  /**
   * Filing, not ownership (ticket 325) — any member who can see the row may
   * park it on an event, and detaching leaves the file on the trip.
   */
  attach: tripProcedure
    .input(
      z.object({
        fileId: z.number().int().positive(),
        dayEventId: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.port.attachFileToEvent(
        ctx.viewer.id,
        input.tripId,
        input.fileId,
        input.dayEventId,
      );
    }),

  detach: tripProcedure
    .input(z.object({ fileId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.detachFileFromEvent(ctx.viewer.id, input.tripId, input.fileId);
    }),

  setCategory: tripProcedure
    .input(z.object({ fileId: z.number().int().positive(), category }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.setFileCategory(
        ctx.viewer.id,
        input.tripId,
        input.fileId,
        input.category,
      );
    }),
});
