/**
 * Wish lists (#623, ADR-049): a few people keep trips, countries, ideas and links before any trip exists.
 * NOT A TRIP SURFACE, so `protectedProcedure`. The host checks the caller's seat on every call; the router only shapes input.
 */
import { WISH_CAPS } from "@floc/core/lists/wish-list";
import { z } from "zod";

import { protectedProcedure, router } from "../trpc";

const listId = z.number().int().positive();
const people = z.array(z.string().min(1).max(64)).max(20);

const item = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("explore"), presetId: z.string().min(1).max(WISH_CAPS.presetId) }),
  z.object({ kind: z.literal("country"), code: z.string().length(2) }),
  z.object({ kind: z.literal("text"), text: z.string().trim().min(1).max(WISH_CAPS.text) }),
  z.object({ kind: z.literal("link"), url: z.string().trim().min(1).max(WISH_CAPS.url), label: z.string().max(WISH_CAPS.label).nullish() }),
]);

export const wishesRouter = router({
  list: protectedProcedure.query(({ ctx }) => ctx.port.loadWishLists(ctx.viewer.id)),

  get: protectedProcedure.input(z.object({ listId })).query(({ ctx, input }) => ctx.port.loadWishList(ctx.viewer.id, input.listId)),

  create: protectedProcedure
    .input(z.object({ inviteIds: people }))
    .mutation(({ ctx, input }) => ctx.port.createWishList(ctx.viewer.id, input.inviteIds)),

  startWith: protectedProcedure
    .input(z.object({ friendId: z.string().min(1).max(64) }))
    .mutation(({ ctx, input }) => ctx.port.startWishListWith(ctx.viewer.id, input.friendId)),

  invite: protectedProcedure
    .input(z.object({ listId, inviteIds: people.min(1) }))
    .mutation(({ ctx, input }) => ctx.port.inviteToWishList(ctx.viewer.id, input.listId, input.inviteIds)),

  respond: protectedProcedure.input(z.object({ listId, accept: z.boolean() })).mutation(async ({ ctx, input }) => {
    await ctx.port.respondToWishInvite(ctx.viewer.id, input.listId, input.accept);
  }),

  leave: protectedProcedure.input(z.object({ listId })).mutation(async ({ ctx, input }) => {
    await ctx.port.leaveWishList(ctx.viewer.id, input.listId);
  }),

  rename: protectedProcedure.input(z.object({ listId, name: z.string().max(WISH_CAPS.name) })).mutation(async ({ ctx, input }) => {
    await ctx.port.renameWishList(ctx.viewer.id, input.listId, input.name);
  }),

  addItem: protectedProcedure
    .input(z.object({ listId, item }))
    .mutation(({ ctx, input }) => ctx.port.addWishItem(ctx.viewer.id, input.listId, input.item)),

  removeItem: protectedProcedure
    .input(z.object({ listId, itemId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.removeWishItem(ctx.viewer.id, input.listId, input.itemId);
    }),

  peopleToAsk: protectedProcedure
    .input(z.object({ listId }))
    .query(({ ctx, input }) => ctx.port.wishListPeopleToAsk(ctx.viewer.id, input.listId)),
});
