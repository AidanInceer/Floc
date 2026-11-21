import { TEXT_CAPS } from "@floc/core/text/text";
import { readWelcomeAnswers } from "@floc/core/people/welcome/welcome";
import { z } from "zod";

import { protectedProcedure, router } from "../trpc";

export const meRouter = router({
  get: protectedProcedure.query(({ ctx }) => ctx.port.loadMe(ctx.viewer.id)),

  profile: protectedProcedure.query(({ ctx }) => ctx.port.loadMyProfile(ctx.viewer.id)),

  welcome: protectedProcedure.query(({ ctx }) => ctx.port.welcome(ctx.viewer.id)),

  finishWelcome: protectedProcedure
    .input(
      z.object({
        airport: z.string().max(3).optional(),
        currency: z.string().max(3).optional(),
        cabin: z.string().max(20).optional(),
        stay: z.string().max(20).optional(),
        pace: z.string().max(20).optional(),
        vibes: z.array(z.string().max(40)).max(20).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.port.finishWelcome(ctx.viewer.id, readWelcomeAnswers(input));
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
