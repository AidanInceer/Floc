/**
 * Explore — your shortlist of listings and your last quiz answers. The
 * listings themselves are static `@floc/core` data both clients read directly.
 */
import { EXPLORE_QUESTIONS, NIGHTS } from "@floc/core/trip/explore/explore-match";
import { z } from "zod";

import { protectedProcedure, router } from "../trpc";

const choice = <K extends keyof typeof EXPLORE_QUESTIONS>(key: K) =>
  z.enum(
    Object.keys(EXPLORE_QUESTIONS[key].options) as [
      keyof (typeof EXPLORE_QUESTIONS)[K]["options"] & string,
      ...(keyof (typeof EXPLORE_QUESTIONS)[K]["options"] & string)[],
    ],
  );

export const exploreRouter = router({
  get: protectedProcedure.query(({ ctx }) => ctx.port.loadExplore(ctx.viewer.id)),

  setSaved: protectedProcedure
    .input(z.object({ presetId: z.string().min(1), saved: z.boolean() }))
    .mutation(({ ctx, input }) =>
      ctx.port.setExploreSaved(ctx.viewer.id, input.presetId, input.saved),
    ),

  setAnswers: protectedProcedure
    .input(
      z.object({
        size: choice("size"),
        when: choice("when"),
        cost: choice("cost"),
        pace: choice("pace"),
        nights: z.number().int().min(NIGHTS.min).max(NIGHTS.max),
      }),
    )
    .mutation(({ ctx, input }) => ctx.port.setExploreAnswers(ctx.viewer.id, input)),
});
