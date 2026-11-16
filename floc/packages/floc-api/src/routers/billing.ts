import { z } from "zod";

import { protectedProcedure, router } from "../trpc";

export const billingRouter = router({
  status: protectedProcedure.query(({ ctx }) => ctx.port.loadBillingStatus(ctx.viewer.id)),

  claim: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["ios", "android"]),
        productId: z.string().min(1).max(100),
        token: z.string().min(1).max(20_000),
      }),
    )
    .mutation(({ ctx, input }) => ctx.port.claimStorePurchase(ctx.viewer.id, input)),
});
