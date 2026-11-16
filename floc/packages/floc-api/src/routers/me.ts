import { TEXT_CAPS } from "@floc/core/text/text";
import { z } from "zod";

import { protectedProcedure, router } from "../trpc";

export const meRouter = router({
  get: protectedProcedure.query(({ ctx }) => ctx.port.loadMe(ctx.viewer.id)),

  profile: protectedProcedure.query(({ ctx }) => ctx.port.loadMyProfile(ctx.viewer.id)),

  tourSeen: protectedProcedure.query(({ ctx }) => ctx.port.tourSeen(ctx.viewer.id)),

  markTourSeen: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.port.markTourSeen(ctx.viewer.id);
  }),

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

  setMark: protectedProcedure
    .input(
      z.object({
        code: z.string().length(2),
        state: z.enum(["green", "yellow", "blank"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.port.setCountryMark(ctx.viewer.id, input.code, input.state);
    }),
});
