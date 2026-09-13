/**
 * Pro, bought through Apple or Google. Stripe stays on the web: its checkout
 * and portal are pages, and the stores refuse an app that links to them.
 */
import { z } from "zod";

import { protectedProcedure, router } from "../trpc";

export const billingRouter = router({
  status: protectedProcedure.query(({ ctx }) => ctx.port.loadBillingStatus(ctx.viewer.id)),

  claim: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["ios", "android"]),
        productId: z.string().min(1).max(100),
        // Why: an App Store JWS runs to a few kilobytes; the cap stops a megabyte body.
        token: z.string().min(1).max(20_000),
      }),
    )
    .mutation(({ ctx, input }) => ctx.port.claimStorePurchase(ctx.viewer.id, input)),
});
