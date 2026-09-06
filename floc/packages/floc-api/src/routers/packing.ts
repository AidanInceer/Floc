/**
 * Packing — the group's list and your own bag (the phone's Packing screen).
 *
 * TWO LISTS, NEVER MERGED. A shared line belongs to the group and is anyone's
 * to claim or drop; a personal line is one person's bag and only ever resolves
 * for its owner. The host keeps them apart in the query rather than filtering
 * after (#220), and nothing here is allowed to put them back together.
 *
 * CLAIMING IS OPEN. Any member may claim any shared line, and several may claim
 * the same one — two of you bringing sun cream is a real answer, not a clash.
 * Claiming is not one of the four admin powers (rule 6).
 *
 * TICKING IS YOURS ALONE. `packed` always means "packed by the caller"; the
 * host scopes the write to (line, viewer), so ticking for somebody else is not
 * expressible rather than merely refused.
 *
 * NOT HERE, ON PURPOSE: the tiers, saved kits, the auto-filler, the filters and
 * the bulk bar the web page carries. Those are a desk's worth of controls, and
 * a phone that half-implemented them would be a second set of rules.
 */
import { PACK_CATEGORIES } from "@floc/core/packing";
import { TEXT_CAPS } from "@floc/core/text";
import { z } from "zod";

import { router, tripProcedure } from "../trpc";

const lineId = z.number().int().positive();

export const packingRouter = router({
  list: tripProcedure.query(({ ctx, input }) => ctx.port.loadPacking(ctx.viewer.id, input.tripId)),

  add: tripProcedure
    .input(
      z.object({
        label: z
          .string()
          .trim()
          .min(1, "A thing to pack needs a name.")
          .max(TEXT_CAPS.packingLabel, "That name is too long."),
        category: z.enum(PACK_CATEGORIES),
        /** True puts it in your own bag, false on the group's list. */
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

  /** Your own bag only — see `stepPackingQuantity` on the port for why it is a delta. */
  stepQuantity: tripProcedure
    .input(z.object({ lineId, delta: z.union([z.literal(1), z.literal(-1)]) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.stepPackingQuantity(ctx.viewer.id, input.tripId, input.lineId, input.delta);
    }),

  remove: tripProcedure
    .input(z.object({ lineId }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.removePackingLine(ctx.viewer.id, input.tripId, input.lineId);
    }),
});
