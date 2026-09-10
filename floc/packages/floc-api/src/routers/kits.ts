/**
 * Saved packing lists (ticket 230) — yours, not a trip's.
 *
 * NOT A TRIP SURFACE, SO NOT A `tripProcedure`. A kit belongs to a person, and
 * every write is owner-scoped on the host rather than resolved through a trip
 * the caller happens to name. `packing.saveKit` and `packing.applyKit` are the
 * trip-side moves and stay where they are; this is the editor.
 *
 * A KIT IS A STENCIL. Copying one into a bag is one direction only — editing
 * the bag afterwards never writes back here, and deleting a kit leaves every
 * bag already filled from it alone.
 */
import { MAX_PACK_QUANTITY, MIN_PACK_QUANTITY, PACK_CATEGORIES } from "@floc/core/packing/packing";
import { TEXT_CAPS } from "@floc/core/text/text";
import { z } from "zod";

import { protectedProcedure, router } from "../trpc";

const kitId = z.number().int().positive();
const itemId = z.number().int().positive();

const kitName = z
  .string()
  .trim()
  .min(1, "Give the list a name.")
  .max(TEXT_CAPS.packingKitName, "That name is too long.");

export const kitsRouter = router({
  /** Every list with its things — the screen draws them all, so asking per kit is 1 + N reads. */
  list: protectedProcedure.query(({ ctx }) => ctx.port.listMyKits(ctx.viewer.id)),

  /** Null at the ceiling rather than a throw — the same shape every capped list here uses. */
  create: protectedProcedure
    .input(z.object({ name: kitName }))
    .mutation(({ ctx, input }) => ctx.port.createKit(ctx.viewer.id, input.name)),

  rename: protectedProcedure
    .input(z.object({ kitId, name: kitName }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.renameKit(ctx.viewer.id, input.kitId, input.name);
    }),

  remove: protectedProcedure
    .input(z.object({ kitId }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.deleteKit(ctx.viewer.id, input.kitId);
    }),

  addItem: protectedProcedure
    .input(
      z.object({
        kitId,
        label: z
          .string()
          .trim()
          .min(1, "A thing to pack needs a name.")
          .max(TEXT_CAPS.packingLabel, "That name is too long."),
        category: z.enum(PACK_CATEGORIES),
        quantity: z.number().int().min(MIN_PACK_QUANTITY).max(MAX_PACK_QUANTITY),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.port.addKitItem(ctx.viewer.id, input.kitId, {
        label: input.label,
        category: input.category,
        quantity: input.quantity,
      });
    }),

  removeItem: protectedProcedure
    .input(z.object({ itemId }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.removeKitItem(ctx.viewer.id, input.itemId);
    }),

  /** A delta, so two quick taps are two additions rather than one stale total. */
  stepItem: protectedProcedure
    .input(z.object({ itemId, delta: z.union([z.literal(1), z.literal(-1)]) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.stepKitItemQuantity(ctx.viewer.id, input.itemId, input.delta);
    }),
});
