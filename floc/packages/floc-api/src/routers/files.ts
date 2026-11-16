import { DOC_CATEGORY_INPUTS, MAX_DOCUMENT_BASE64_LENGTH, parseDocCategory } from "@floc/core/documents/documents";
import { TEXT_CAPS } from "@floc/core/text/text";
import { z } from "zod";

import { router, tripProcedure } from "../trpc";

const category = z.enum(DOC_CATEGORY_INPUTS).transform(parseDocCategory);

export const filesRouter = router({
  list: tripProcedure.query(({ ctx, input }) =>
    ctx.port.listFiles(ctx.viewer.id, input.tripId),
  ),

  canUpload: tripProcedure.query(({ ctx }) => ctx.port.filesWritable()),

  inboxAddress: tripProcedure.query(({ ctx, input }) =>
    ctx.port.fileInboxAddress(ctx.viewer.id, input.tripId),
  ),

  upload: tripProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(200),
        mimeType: z.string().min(1).max(120),
        contentBase64: z.string().min(1).max(MAX_DOCUMENT_BASE64_LENGTH, "Files are capped at 8 MB"),
        category,
        shared: z.boolean(),
        dayEventId: z.number().int().positive().nullable().default(null),
        dayId: z.number().int().positive().nullable().default(null),
      }),
    )
    .mutation(({ ctx, input }) => {
      const { tripId, ...file } = input;
      return ctx.port.uploadFile(ctx.viewer.id, tripId, file);
    }),

  viewUrl: tripProcedure
    .input(z.object({ fileId: z.number().int().positive() }))
    .query(({ ctx, input }) => ctx.port.fileViewUrl(ctx.viewer.id, input.tripId, input.fileId)),

  remove: tripProcedure
    .input(z.object({ fileId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.deleteFile(ctx.viewer.id, input.tripId, input.fileId);
    }),

  archived: tripProcedure.query(({ ctx, input }) =>
    ctx.port.listArchivedFiles(ctx.viewer.id, input.tripId),
  ),

  restore: tripProcedure
    .input(z.object({ fileId: z.number().int().positive() }))
    .mutation(({ ctx, input }) => ctx.port.restoreFile(ctx.viewer.id, input.tripId, input.fileId)),

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

  usage: tripProcedure.query(({ ctx, input }) => ctx.port.fileUsage(ctx.viewer.id, input.tripId)),

  rename: tripProcedure
    .input(
      z.object({
        fileId: z.number().int().positive(),
        name: z.string().trim().min(1, "Give the file a name.").max(TEXT_CAPS.documentName),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.port.renameFile(ctx.viewer.id, input.tripId, input.fileId, input.name),
    ),

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
