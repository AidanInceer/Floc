import { z } from "zod";

import { NUDGE_TASKS } from "@floc/core/trip/nudge/nudge";

import { router, tripProcedure } from "../../trpc";

const MAX_PEOPLE = 50;

export const nudgesRouter = router({
  targets: tripProcedure.query(({ ctx, input }) => ctx.port.nudgeTargets(ctx.viewer.id, input.tripId)),

  send: tripProcedure
    .input(z.object({ task: z.enum(NUDGE_TASKS), userIds: z.array(z.string().min(1).max(64)).min(1).max(MAX_PEOPLE) }))
    .mutation(({ ctx, input }) => ctx.port.sendNudges(ctx.viewer.id, input.tripId, input.task, input.userIds)),
});
