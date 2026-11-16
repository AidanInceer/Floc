import { TEXT_CAPS } from "@floc/core/text/text";
import { z } from "zod";

import { protectedProcedure, router } from "../../trpc";

export const feedbackRouter = router({
  send: protectedProcedure
    .input(
      z.object({
        message: z.string().max(TEXT_CAPS.feedback),
        page: z.string().max(200),
        surface: z.enum(["ios", "android"]),
        appVersion: z.string().max(40),
      }),
    )
    .mutation(({ ctx, input }) => ctx.port.sendFeedback(ctx.viewer, input)),
});
