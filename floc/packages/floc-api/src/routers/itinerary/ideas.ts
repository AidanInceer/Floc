import { IDEA_CATEGORY_MAX } from "@floc/core/trip/idea-categories";
import { TEXT_CAPS } from "@floc/core/text/text";
import { z } from "zod";

import { router, tripProcedure } from "../../trpc";

const ideaId = z.object({ ideaId: z.number().int().positive() });
const title = z
  .string()
  .trim()
  .min(1, "An idea needs a line of text.")
  .max(TEXT_CAPS.ideaTitle, "That idea is too long.");
const clockTime = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a 24-hour HH:MM time.")
  .nullable();

export const ideasRouter = router({
  list: tripProcedure.query(({ ctx, input }) => ctx.port.listIdeas(ctx.viewer.id, input.tripId)),

  add: tripProcedure
    .input(z.object({ title, category: z.string().trim().max(IDEA_CATEGORY_MAX).optional() }))
    .mutation(({ ctx, input }) => ctx.port.addIdea(ctx.viewer.id, input.tripId, input.title, input.category)),

  vote: tripProcedure
    .input(ideaId)
    .mutation(({ ctx, input }) => ctx.port.voteIdea(ctx.viewer.id, input.tripId, input.ideaId)),

  remove: tripProcedure
    .input(ideaId)
    .mutation(({ ctx, input }) => ctx.port.removeIdea(ctx.viewer.id, input.tripId, input.ideaId)),

  rename: tripProcedure
    .input(ideaId.extend({ title }))
    .mutation(({ ctx, input }) => ctx.port.renameIdea(ctx.viewer.id, input.tripId, input.ideaId, input.title)),

  restore: tripProcedure
    .input(ideaId)
    .mutation(({ ctx, input }) => ctx.port.restoreIdea(ctx.viewer.id, input.tripId, input.ideaId)),

  addToDays: tripProcedure
    .input(ideaId.extend({ dayId: z.number().int().positive(), time: clockTime.default(null) }))
    .mutation(({ ctx, input }) => ctx.port.addIdeaToDays(ctx.viewer.id, input.tripId, input.ideaId, input.dayId, input.time)),

  takeOffDays: tripProcedure
    .input(ideaId)
    .mutation(({ ctx, input }) => ctx.port.takeIdeaOffDays(ctx.viewer.id, input.tripId, input.ideaId)),
});
