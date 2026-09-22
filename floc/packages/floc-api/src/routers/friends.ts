/**
 * Friends: the three lists, and the five buttons that move a pair between them
 * (ticket 18, ticket 96).
 *
 * WHO MAY ASK WHOM IS NOT DECIDED HERE. `requestFriend` takes an id and the
 * host re-derives whether that person is inside one of the viewer's rings —
 * exactly as the web action does (ticket 46). Restating the rule here would be
 * a second, quieter permission model.
 *
 * A REFUSED REQUEST IS SILENT. Answering "no such person" would make this a
 * way to test whether an account exists, which is the hole ticket 46 shut.
 *
 * SEARCH IS A MUTATION (#360) though it writes nothing: a query travels in the
 * URL, and what people type into a search box ends up in server logs.
 */
import { z } from "zod";

import { protectedProcedure, router } from "../trpc";

const person = z.object({ userId: z.string().min(1) });
const typed = z.string().trim().min(1).max(254);

export const friendsRouter = router({
  /** Friends, incoming and outgoing in one read — the screen draws all three. */
  list: protectedProcedure.query(({ ctx }) => ctx.port.loadFriends(ctx.viewer.id)),

  request: protectedProcedure
    .input(person)
    .mutation(async ({ ctx, input }) => {
      await ctx.port.requestFriend(ctx.viewer.id, input.userId);
    }),

  find: protectedProcedure
    .input(z.object({ query: typed }))
    .mutation(({ ctx, input }) => ctx.port.findFriends(ctx.viewer.id, input.query)),

  requestByCode: protectedProcedure
    .input(z.object({ code: typed }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.requestFriendByCode(ctx.viewer.id, input.code);
    }),

  accept: protectedProcedure.input(person).mutation(async ({ ctx, input }) => {
    await ctx.port.acceptFriend(ctx.viewer.id, input.userId);
  }),

  decline: protectedProcedure.input(person).mutation(async ({ ctx, input }) => {
    await ctx.port.declineFriend(ctx.viewer.id, input.userId);
  }),

  /** The same write as declining, from the other end of the pair. */
  cancel: protectedProcedure.input(person).mutation(async ({ ctx, input }) => {
    await ctx.port.cancelFriendRequest(ctx.viewer.id, input.userId);
  }),

  remove: protectedProcedure.input(person).mutation(async ({ ctx, input }) => {
    await ctx.port.removeFriend(ctx.viewer.id, input.userId);
  }),
});
