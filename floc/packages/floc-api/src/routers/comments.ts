import { REACTION_KINDS } from "@floc/core/vocabulary";
import { TEXT_CAPS } from "@floc/core/text/text";
import { z } from "zod";

import { router, tripProcedure } from "../trpc";

const onEvent = z.object({ dayEventId: z.number().int().positive() });
const body = z
  .string()
  .trim()
  .min(1, "Write something first.")
  .max(TEXT_CAPS.noteBody, "That comment is too long to save.");

export const commentsRouter = router({
  onEvent: tripProcedure
    .input(onEvent)
    .query(({ ctx, input }) =>
      ctx.port.listEventComments(ctx.viewer.id, input.tripId, input.dayEventId),
    ),

  add: tripProcedure
    .input(
      onEvent.extend({
        replyTo: z.number().int().positive().nullable(),
        body,
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.port.addEventComment(
        ctx.viewer.id,
        input.tripId,
        input.dayEventId,
        input.replyTo,
        input.body,
      ),
    ),

  edit: tripProcedure
    .input(z.object({ commentId: z.number().int().positive(), body }))
    .mutation(({ ctx, input }) =>
      ctx.port.editComment(ctx.viewer.id, input.tripId, input.commentId, input.body),
    ),

  remove: tripProcedure
    .input(z.object({ commentId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.deleteComment(ctx.viewer.id, input.tripId, input.commentId);
    }),

  react: tripProcedure
    .input(
      z.object({
        commentId: z.number().int().positive(),
        kind: z.enum(REACTION_KINDS),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.port.reactToComment(
        ctx.viewer.id,
        input.tripId,
        input.commentId,
        input.kind,
      );
    }),
});
