import { z } from "zod";

import { protectedProcedure, router } from "../trpc";

export const peopleRouter = router({
  profile: protectedProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(({ ctx, input }) => ctx.port.loadProfileOf(ctx.viewer.id, input.userId)),
});
