import { NO_PACK_LABEL, PACK_CATEGORIES, PACK_TIERS } from "@floc/core/packing/packing";
import { TEXT_CAPS } from "@floc/core/text/text";
import { z } from "zod";

import { router, tripProcedure } from "../trpc";
import { kitName } from "./kits";

const lineId = z.number().int().positive();

const label = z
  .string()
  .trim()
  .min(1, NO_PACK_LABEL)
  .max(TEXT_CAPS.packingLabel, "That name is too long.");

const MAX_BULK = 500;

export const packingRouter = router({
  list: tripProcedure.query(({ ctx, input }) => ctx.port.loadPacking(ctx.viewer.id, input.tripId)),

  add: tripProcedure
    .input(
      z.object({
        label,
        category: z.enum(PACK_CATEGORIES).nullish().transform((c) => c ?? null),
        mine: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tripId, ...line } = input;
      await ctx.port.addPackingLine(ctx.viewer.id, tripId, line);
    }),

  claim: tripProcedure
    .input(z.object({ lineId, claimed: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.claimPackingLine(ctx.viewer.id, input.tripId, input.lineId, input.claimed);
    }),

  setPacked: tripProcedure
    .input(z.object({ lineId, packed: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.setPackingPacked(ctx.viewer.id, input.tripId, input.lineId, input.packed);
    }),

  stepQuantity: tripProcedure
    .input(z.object({ lineId, delta: z.union([z.literal(1), z.literal(-1)]) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.stepPackingQuantity(ctx.viewer.id, input.tripId, input.lineId, input.delta);
    }),

  rename: tripProcedure
    .input(z.object({ lineId, label }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.renamePackingLine(ctx.viewer.id, input.tripId, input.lineId, input.label);
    }),

  remove: tripProcedure
    .input(z.object({ lineId }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.removePackingLine(ctx.viewer.id, input.tripId, input.lineId);
    }),

  removeMany: tripProcedure
    .input(z.object({ lineIds: z.array(lineId).min(1).max(MAX_BULK) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.removePackingLines(ctx.viewer.id, input.tripId, input.lineIds);
    }),

  reset: tripProcedure
    .input(z.object({ mine: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.resetPackingList(ctx.viewer.id, input.tripId, input.mine);
    }),

  setTier: tripProcedure
    .input(z.object({ tier: z.enum(PACK_TIERS) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.setPackTier(ctx.viewer.id, input.tripId, input.tier);
    }),

  fillMyBag: tripProcedure.mutation(async ({ ctx, input }) => {
    await ctx.port.fillMyBag(ctx.viewer.id, input.tripId);
  }),

  takeIdea: tripProcedure
    .input(z.object({ label }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.takePackingIdea(ctx.viewer.id, input.tripId, input.label);
    }),

  removeSuggested: tripProcedure.mutation(async ({ ctx, input }) => {
    await ctx.port.removeSuggestedPacking(ctx.viewer.id, input.tripId);
  }),

  removeUnpacked: tripProcedure.mutation(async ({ ctx, input }) => {
    await ctx.port.removeUnpackedPacking(ctx.viewer.id, input.tripId);
  }),

  unpackBag: tripProcedure.mutation(async ({ ctx, input }) => {
    await ctx.port.unpackMyBag(ctx.viewer.id, input.tripId);
  }),

  setIdeasShown: tripProcedure
    .input(z.object({ shown: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.setPackingIdeasShown(ctx.viewer.id, input.tripId, input.shown);
    }),

  applyKit: tripProcedure
    .input(z.object({ kitId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.applyPackingKit(ctx.viewer.id, input.tripId, input.kitId);
    }),

  saveKit: tripProcedure
    .input(z.object({ name: kitName }))
    .mutation(({ ctx, input }) => ctx.port.savePackingKit(ctx.viewer.id, input.tripId, input.name)),

  deleteKit: tripProcedure
    .input(z.object({ kitId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.deleteKit(ctx.viewer.id, input.kitId);
    }),
});
