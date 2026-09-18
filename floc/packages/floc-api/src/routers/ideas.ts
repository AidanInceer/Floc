/**
 * Ideas — where the trip could go, before it has dates.
 *
 * Why: add, vote and remove are open to every member. An idea is the group's,
 * and gating removal would be a fourth admin power (rule 6).
 */
import { TEXT_CAPS } from "@floc/core/text/text";
import { z } from "zod";

import { router, tripProcedure } from "../trpc";

const ideaId = z.object({ ideaId: z.number().int().positive() });

export const ideasRouter = router({
  list: tripProcedure.query(({ ctx, input }) => ctx.port.listIdeas(ctx.viewer.id, input.tripId)),

  add: tripProcedure
    .input(
      z.object({
        title: z
          .string()
          .trim()
          .min(1, "An idea needs a line of text.")
          .max(TEXT_CAPS.ideaTitle, "That idea is too long."),
      }),
    )
    .mutation(({ ctx, input }) => ctx.port.addIdea(ctx.viewer.id, input.tripId, input.title)),

  vote: tripProcedure
    .input(ideaId)
    .mutation(({ ctx, input }) => ctx.port.voteIdea(ctx.viewer.id, input.tripId, input.ideaId)),

  remove: tripProcedure
    .input(ideaId)
    .mutation(({ ctx, input }) => ctx.port.removeIdea(ctx.viewer.id, input.tripId, input.ideaId)),
});
