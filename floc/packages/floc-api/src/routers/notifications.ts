/**
 * The inbox and the bell (#344). The rules for who hears what live on the host,
 * in the activity log's writers — this only reads what they wrote.
 */
import { z } from "zod";

import { protectedProcedure, router } from "../trpc";

const pushTokenInput = z.string().min(1).max(200);

export const notificationsRouter = router({
  list: protectedProcedure
    .input(z.object({ cursor: z.string().max(64).nullish() }))
    .query(({ ctx, input }) => ctx.port.listNotifications(ctx.viewer.id, input.cursor ?? null)),

  unread: protectedProcedure.query(({ ctx }) => ctx.port.countUnreadNotifications(ctx.viewer.id)),

  open: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(({ ctx, input }) => ctx.port.openNotification(ctx.viewer.id, input.id)),

  registerPhone: protectedProcedure
    .input(z.object({ token: pushTokenInput }))
    .mutation(({ ctx, input }) => ctx.port.registerPushToken(ctx.viewer.id, input.token)),

  forgetPhone: protectedProcedure
    .input(z.object({ token: pushTokenInput }))
    .mutation(({ ctx, input }) => ctx.port.forgetPushToken(ctx.viewer.id, input.token)),
});
