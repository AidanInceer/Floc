import { z } from "zod";

import { protectedProcedure, router } from "../trpc";

const person = z.object({ userId: z.string().min(1) });
const typed = z.string().trim().min(1).max(254);

export const friendsRouter = router({
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

  cancel: protectedProcedure.input(person).mutation(async ({ ctx, input }) => {
    await ctx.port.cancelFriendRequest(ctx.viewer.id, input.userId);
  }),

  remove: protectedProcedure.input(person).mutation(async ({ ctx, input }) => {
    await ctx.port.removeFriend(ctx.viewer.id, input.userId);
  }),
});
