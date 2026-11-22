import { ESTIMATE_LINES } from "@floc/core/money/estimate/lines";
import { CABINS, PACES, STAY_STYLES } from "@floc/core/money/estimate/style";
import { TRAVEL_MODES } from "@floc/core/money/estimate/travel";
import { z } from "zod";

import { protectedProcedure, router, tripProcedure } from "../trpc";

const amount = z.number().int("Money is integer minor units — never a float.").nonnegative().nullable();

export const estimateRouter = router({
  view: tripProcedure.query(({ ctx, input }) => ctx.port.loadEstimate(ctx.viewer.id, input.tripId)),

  setBudget: tripProcedure
    .input(z.object({ amountMinor: amount }))
    .mutation(({ ctx, input }) => ctx.port.setEstimateBudget(ctx.viewer.id, input.tripId, input.amountMinor)),

  setLine: tripProcedure
    .input(z.object({ line: z.enum(ESTIMATE_LINES), figure: amount.optional(), budget: amount.optional(), notNeeded: z.boolean().optional() }))
    .mutation(({ ctx, input }) => {
      const { tripId, line, ...patch } = input;
      return ctx.port.setEstimateLine(ctx.viewer.id, tripId, line, patch);
    }),

  setTravel: tripProcedure
    .input(z.object({ travel: z.enum(TRAVEL_MODES) }))
    .mutation(({ ctx, input }) => ctx.port.setEstimateTravel(ctx.viewer.id, input.tripId, input.travel)),

  setStyle: tripProcedure
    .input(z.object({ style: z.object({ cabin: z.enum(CABINS).optional(), stay: z.enum(STAY_STYLES).optional(), pace: z.enum(PACES).optional() }).nullable() }))
    .mutation(({ ctx, input }) => ctx.port.setEstimateStyle(ctx.viewer.id, input.tripId, input.style)),

  setNights: tripProcedure
    .input(z.object({ nights: z.number().int().min(1).max(365).nullable() }))
    .mutation(({ ctx, input }) => ctx.port.setEstimateNights(ctx.viewer.id, input.tripId, input.nights)),

  settings: protectedProcedure.query(({ ctx }) => ctx.port.loadEstimateSettings(ctx.viewer.id)),

  setSettings: protectedProcedure
    .input(
      z.object({
        homeAirport: z.string().regex(/^[A-Za-z]{3}$/, "An airport code is three letters, such as LHR.").nullable().optional(),
        cabin: z.enum(CABINS).optional(),
        stay: z.enum(STAY_STYLES).optional(),
        pace: z.enum(PACES).optional(),
      }),
    )
    .mutation(({ ctx, input }) => ctx.port.setEstimateSettings(ctx.viewer.id, input)),
});
