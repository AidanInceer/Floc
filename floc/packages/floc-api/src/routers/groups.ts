/**
 * Named groups of people you travel with (#545). Only the maker sees a group; nobody in it is told.
 * Who may be in one is decided by the host (`createGroup` and friends re-check it), never here.
 */
import { z } from "zod";
import { GROUP_CAP, GROUP_NAME_CAP } from "@floc/core/people/group-ticks";

import { protectedProcedure, router } from "../trpc";

const groupId = z.number().int().positive();
const input = z.object({
  name: z.string().trim().min(1).max(GROUP_NAME_CAP),
  memberIds: z.array(z.string().min(1)).min(1).max(GROUP_CAP),
});

export const groupsRouter = router({
  list: protectedProcedure.query(({ ctx }) => ctx.port.loadGroups(ctx.viewer.id)),

  pastTrips: protectedProcedure.query(({ ctx }) => ctx.port.loadPastTripPeople(ctx.viewer.id)),

  create: protectedProcedure
    .input(input)
    .mutation(({ ctx, input }) => ctx.port.createGroup(ctx.viewer.id, input)),

  save: protectedProcedure
    .input(input.extend({ groupId }))
    .mutation(async ({ ctx, input: { groupId, ...group } }) => {
      await ctx.port.saveGroup(ctx.viewer.id, groupId, group);
    }),

  setMember: protectedProcedure
    .input(z.object({ groupId, userId: z.string().min(1), on: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.setGroupMember(ctx.viewer.id, input.groupId, input.userId, input.on);
    }),

  delete: protectedProcedure.input(z.object({ groupId })).mutation(async ({ ctx, input }) => {
    await ctx.port.deleteGroup(ctx.viewer.id, input.groupId);
  }),
});
