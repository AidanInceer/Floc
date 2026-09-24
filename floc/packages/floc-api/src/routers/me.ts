/**
 * The signed-in person (#302) — what you curate, not what you configure.
 *
 * Why: the web splits profile from settings and the phone keeps the split, so nothing about
 * visibility, notifications or the account belongs here. `been` and `wantToGo` are derived on read
 * from the trips you are on, never stored (#95), so they cannot disagree with the web's map.
 */
import { TEXT_CAPS } from "@floc/core/text/text";
import { z } from "zod";

import { protectedProcedure, router } from "../trpc";

export const meRouter = router({
  get: protectedProcedure.query(({ ctx }) => ctx.port.loadMe(ctx.viewer.id)),

  // Why: its own procedure because every screen wanting the viewer's id calls `get`, and none of
  // them want a travel map with it.
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

  // Why: `blank` is not delete — over a country a trip still claims, it stores a rejection, or
  // the app goes on asserting something false. The host tells the two cases apart (#108).
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

  // Why: a trip's countries stop being derived the moment the membership ends, so this is the
  // only moment they can be kept (#95).
  mapPrompts: protectedProcedure.query(({ ctx }) => ctx.port.listMapPrompts(ctx.viewer.id)),

  answerMapPrompt: protectedProcedure
    .input(z.object({ tripId: z.number().int().positive(), keep: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.answerMapPrompt(ctx.viewer.id, input.tripId, input.keep);
    }),
});
