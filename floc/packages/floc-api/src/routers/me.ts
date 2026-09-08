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

  /**
   * The face: vibe tags, the travel map and the trips you have been on. Its
   * own procedure because every screen wanting the viewer's id calls `get`,
   * and none of them want a map with it.
   */
  profile: protectedProcedure.query(({ ctx }) => ctx.port.loadMyProfile(ctx.viewer.id)),

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

  /**
   * The travel map's hand marks (ticket 108). Trip marks are derived on read
   * and are nobody's to edit; these are the ones you paint yourself.
   *
   * `blank` is not simply "delete". Over a country a trip still claims it
   * stores a rejection — "no, I didn't go" — because without one the app goes
   * on asserting something false. The host tells the two cases apart.
   */
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

  /**
   * Questions a trip left behind when you stopped being on it (ticket 95).
   * Its countries stop being derived the moment the membership ends, so this
   * is the only moment they can be kept. Nobody answers it for somebody else.
   */
  mapPrompts: protectedProcedure.query(({ ctx }) => ctx.port.listMapPrompts(ctx.viewer.id)),

  answerMapPrompt: protectedProcedure
    .input(z.object({ tripId: z.number().int().positive(), keep: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.answerMapPrompt(ctx.viewer.id, input.tripId, input.keep);
    }),
});
