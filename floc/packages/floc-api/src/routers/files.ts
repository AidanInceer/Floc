/**
 * The trip's files (tickets 239, 296).
 *
 * The private/shared line is the port's to draw, not this router's. A viewer
 * id goes down with every call and the implementation filters on it, so there
 * is no shape of request that returns somebody else's private file.
 *
 * UPLOADING IS BASE64, NOT MULTIPART. A phone has no form to post and the cap
 * is 10 MB either way, so the wire carries a third more than the file on a rare
 * action — cheaper than a second upload endpoint with its own auth to get wrong.
 *
 * REFUSALS COME BACK AS WORDS, NOT THROWS. A full trip and an unsupported type
 * are ordinary mistakes; `upload` answers with the sentence a form shows, and
 * null when the file landed.
 */
import { DOC_CATEGORIES } from "@floc/core/documents/documents";
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
        contentBase64: z.string().min(1),
        category,
        shared: z.boolean(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const { tripId, ...file } = input;
      return ctx.port.uploadFile(ctx.viewer.id, tripId, file);
    }),

  /** Uploader only — a booking somebody else is relying on is not yours to bin. */
  remove: tripProcedure
    .input(z.object({ fileId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.deleteFile(ctx.viewer.id, input.tripId, input.fileId);
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
