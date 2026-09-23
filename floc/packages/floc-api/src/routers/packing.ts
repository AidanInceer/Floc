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
 * Claiming is not one of the admin powers (rule 6).
 *
 * TICKING IS YOURS ALONE. `packed` always means "packed by the caller"; the
 * host scopes the write to (line, viewer), so ticking for somebody else is not
 * expressible rather than merely refused.
 *
 * THE SETUP HALF ARRIVED LATER. Tiers, saved kits, the auto-filler, the bulk
 * remove and the reset were held back while the phone had only the lists. They
 * are here now, and every one of them is the *same* rule as the web's: the
 * tier is per-trip so Light for a weekend leaves the default alone, auto-fill
 * is additive and entitlement-gated, a kit is idempotent, and a reset names
 * one list. None of that is re-decided here — the port carries it.
 *
 * A KIT IS MADE BY NAMING A BAG. The phone does not get the web's kit editor,
 * because it does not need one: the bag on screen is already the list, so
 * `saveKit` names it. Editing the contents of a saved kit stays a desk job.
 */
import { PACK_CATEGORIES, PACK_TIERS } from "@floc/core/packing/packing";
import { TEXT_CAPS } from "@floc/core/text/text";
import { z } from "zod";

import { router, tripProcedure } from "../trpc";

const lineId = z.number().int().positive();

const label = z
  .string()
  .trim()
  .min(1, "A thing to pack needs a name.")
  .max(TEXT_CAPS.packingLabel, "That name is too long.");

/** Matches the host's `LIMITS.packingLines` — a list cannot offer more than it holds. */
const MAX_BULK = 500;

export const packingRouter = router({
  list: tripProcedure.query(({ ctx, input }) => ctx.port.loadPacking(ctx.viewer.id, input.tripId)),

  add: tripProcedure
    .input(
      z.object({
        label,
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

  /**
   * The bulk bar's one press (ticket 229). Capped because the tick boxes can
   * only ever offer what a list holds — anything past that is a hand-made call
   * asking for one round trip per id.
   */
  removeMany: tripProcedure
    .input(z.object({ lineIds: z.array(lineId).min(1).max(MAX_BULK) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.removePackingLines(ctx.viewer.id, input.tripId, input.lineIds);
    }),

  /** Empties one list. Which one is the only input, and the host applies the scope. */
  reset: tripProcedure
    .input(z.object({ mine: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.resetPackingList(ctx.viewer.id, input.tripId, input.mine);
    }),

  /** This trip only — never the profile default (ticket 220). */
  setTier: tripProcedure
    .input(z.object({ tier: z.enum(PACK_TIERS) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.setPackTier(ctx.viewer.id, input.tripId, input.tier);
    }),

  /** Refused without the entitlement — the host checks, not this. */
  fillMyBag: tripProcedure.mutation(async ({ ctx, input }) => {
    await ctx.port.fillMyBag(ctx.viewer.id, input.tripId);
  }),

  applyKit: tripProcedure
    .input(z.object({ kitId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.applyPackingKit(ctx.viewer.id, input.tripId, input.kitId);
    }),

  /** Names the bag in front of you as a kit. False at the ceiling, never a throw. */
  saveKit: tripProcedure
    .input(
      z.object({
        name: z
          .string()
          .trim()
          .min(1, "Give the kit a name.")
          .max(TEXT_CAPS.packingKitName, "That name is too long."),
      }),
    )
    .mutation(({ ctx, input }) => ctx.port.savePackingKit(ctx.viewer.id, input.tripId, input.name)),

  /**
   * A kit belongs to you, not to a trip — but the only screen that lists yours
   * is a trip's, so this is reached through one. The host resolves by owner.
   */
  deleteKit: tripProcedure
    .input(z.object({ kitId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.deletePackingKit(ctx.viewer.id, input.kitId);
    }),
});
