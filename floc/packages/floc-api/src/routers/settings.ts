import { AVATAR_ICONS } from "@floc/core/people/avatar-icon";
import { CURRENCIES } from "@floc/core/money/currency";
import { PACK_TIERS } from "@floc/core/packing/packing";
import { TEXT_CAPS } from "@floc/core/text/text";
import { VIBE_TAGS } from "@floc/core/trip/vibe-tags";
import { FLIGHT_SITES, STAY_SITES } from "@floc/core/trip/booking/booking-sites";
import { z } from "zod";

import { protectedProcedure, router } from "../trpc";

const visibility = z.enum(["private", "friends", "trip_members"]);

export const settingsRouter = router({
  get: protectedProcedure.query(({ ctx }) => ctx.port.loadMySettings(ctx.viewer.id)),

  identity: protectedProcedure
    .input(
      z.object({
        displayName: z
          .string()
          .trim()
          .min(1, "Give yourself a name.")
          .max(TEXT_CAPS.displayName, "That name is too long."),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.port.updateIdentity(ctx.viewer.id, {
        displayName: input.displayName,
      });
    }),

  face: protectedProcedure
    .input(z.object({ avatarIcon: z.enum(AVATAR_ICONS).nullable() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.updateAvatarIcon(ctx.viewer.id, input.avatarIcon);
    }),

  privacy: protectedProcedure
    .input(
      z.object({
        isPrivate: z.boolean(),
        visibilityVibeTags: visibility,
        visibilityTravelMap: visibility,
        visibilityFriends: visibility,
        visibilitySaved: visibility,
        pastTripsShow: z.enum(["all", "latest"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.port.updatePrivacy(ctx.viewer.id, input);
    }),

  vibeTags: protectedProcedure
    .input(z.object({ tags: z.array(z.enum(VIBE_TAGS)).max(VIBE_TAGS.length) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.updateVibeTags(ctx.viewer.id, [...input.tags]);
    }),

  packing: protectedProcedure
    .input(z.object({ tier: z.enum(PACK_TIERS), autoGenerate: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.updatePackingDefaults(ctx.viewer.id, input);
    }),

  bookingSite: protectedProcedure
    .input(
      z.discriminatedUnion("kind", [
        z.object({ kind: z.literal("flights"), site: z.enum(FLIGHT_SITES) }),
        z.object({ kind: z.literal("stays"), site: z.enum(STAY_SITES) }),
      ]),
    )
    .mutation(({ ctx, input }) => ctx.port.toggleBookingSite(ctx.viewer.id, input.kind, input.site)),

  currency: protectedProcedure
    .input(z.object({ currency: z.enum(CURRENCIES) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.updateHomeCurrency(ctx.viewer.id, input.currency);
    }),

  motion: protectedProcedure
    .input(z.object({ reduce: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.updateReduceMotion(ctx.viewer.id, input.reduce);
    }),

  notifications: protectedProcedure
    .input(z.object({ push: z.boolean(), email: z.boolean(), reminders: z.boolean(), nextTrip: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.updateNotifications(ctx.viewer.id, input);
    }),

  unlinkSignIn: protectedProcedure
    .input(z.object({ accountId: z.string().min(1) }))
    .mutation(({ ctx, input }) => ctx.port.unlinkSignIn(ctx.viewer.id, input.accountId)),

  removeCalendar: protectedProcedure.mutation(({ ctx }) => ctx.port.removeCalendarAccess(ctx.viewer.id)),

  deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.port.deleteMyAccount(ctx.viewer.id);
  }),
});
