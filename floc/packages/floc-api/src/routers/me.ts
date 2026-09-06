/**
 * The signed-in person (ticket 302).
 *
 * WHAT YOU CURATE, NOT WHAT YOU CONFIGURE. The web app splits profile from
 * settings and the phone keeps the split, so this carries a name, a picture
 * and the travel map's counts — and nothing about visibility, notifications or
 * the account. Those are settings, they are edited on the web, and collapsing
 * the two produces an endpoint that is neither.
 *
 * `been` and `wantToGo` are derived on read from the trips you are on, never
 * stored (#95), so they cannot disagree with the map the web app draws.
 */
import { TEXT_CAPS } from "@floc/core/text";
import { z } from "zod";

import { protectedProcedure, router } from "../trpc";

export const meRouter = router({
  get: protectedProcedure.query(({ ctx }) => ctx.port.loadMe(ctx.viewer.id)),

  rename: protectedProcedure
    .input(
      z.object({
        displayName: z
          .string()
          .trim()
          .min(1, "Give yourself a name.")
          .max(TEXT_CAPS.displayName, "That name is too long."),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.port.renameMe(ctx.viewer.id, input.displayName);
    }),
});
