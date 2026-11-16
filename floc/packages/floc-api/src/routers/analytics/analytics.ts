import { ANALYTICS_EVENTS } from "@floc/core/analytics/events";
import { z } from "zod";

import { protectedProcedure, router } from "../../trpc";

export const analyticsRouter = router({
  track: protectedProcedure
    .input(z.object({ name: z.enum(ANALYTICS_EVENTS), path: z.string().max(200), surface: z.enum(["ios", "android"]) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.recordAnalytics(input);
    }),
});
