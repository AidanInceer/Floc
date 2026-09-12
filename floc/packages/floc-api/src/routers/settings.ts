/**
 * Settings — what you configure, as against what you curate (tickets 07, 46, 236).
 *
 * ONE READ, MANY WRITES. `get` hands back the whole record because it *is* one
 * row and one screen; each write names one panel because saving privacy
 * alongside dietary would blank whichever half the open editor did not carry.
 * That is the web's split, kept exactly.
 *
 * VALIDATE AT THE DOOR. Every enum is re-checked here from `@floc/core`, not
 * trusted from the client: a phone is not a trusted caller, and the seed lists
 * (vibe tags, diets, currencies, rings) are the whole guard against a
 * hand-made call inventing a value the web app could never send.
 *
 * THE ACCOUNT PANEL IS NOT THE PROFILE. Email comes from whichever provider
 * signed you in and cannot be changed; unlinking your last sign-in method is
 * refused rather than obeyed; deleting is its own procedure with its own name
 * so nothing can reach it by mistake.
 */

import { AVATAR_ICONS } from "@floc/core/people/avatar-icon";
import { CURRENCIES } from "@floc/core/money/currency";
import { DIET_FLAGS, MAX_DIETARY_NOTES } from "@floc/core/people/dietary";
import { PACK_TIERS } from "@floc/core/packing/packing";
import { TEXT_CAPS } from "@floc/core/text/text";
import { VIBE_TAGS } from "@floc/core/trip/vibe-tags";
import { z } from "zod";

import { protectedProcedure, router } from "../trpc";

/** The three rings, in the order they nest. Widest last. */
const visibility = z.enum(["private", "friends", "trip_members"]);

const dietFlag = z.enum(Object.keys(DIET_FLAGS) as [string, ...string[]]);

export const settingsRouter = router({
  get: protectedProcedure.query(({ ctx }) => ctx.port.loadMySettings(ctx.viewer.id)),

  /**
   * Your name.
   */
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

  /** Null is initials, which is the default rather than a fallback (#157). */
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
        pastTripsShow: z.enum(["all", "latest"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.port.updatePrivacy(ctx.viewer.id, input);
    }),

  /** Seed-only, checked here as well as on the host — see `parseVibeTags`. */
  vibeTags: protectedProcedure
    .input(z.object({ tags: z.array(z.enum(VIBE_TAGS)).max(VIBE_TAGS.length) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.updateVibeTags(ctx.viewer.id, [...input.tags]);
    }),

  /** All three together: you cannot publish half a dietary record. */
  dietary: protectedProcedure
    .input(
      z.object({
        flags: z.array(dietFlag).max(Object.keys(DIET_FLAGS).length),
        notes: z.string().trim().max(MAX_DIETARY_NOTES).nullable(),
        share: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.port.updateDietary(ctx.viewer.id, {
        flags: [...input.flags],
        notes: input.notes || null,
        share: input.share,
      });
    }),

  /** Where a new trip starts. A trip that has chosen for itself ignores this (ticket 220). */
  packing: protectedProcedure
    .input(z.object({ tier: z.enum(PACK_TIERS), autoGenerate: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.updatePackingDefaults(ctx.viewer.id, input);
    }),

  currency: protectedProcedure
    .input(z.object({ currency: z.enum(CURRENCIES) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.updateHomeCurrency(ctx.viewer.id, input.currency);
    }),

  notifications: protectedProcedure
    .input(z.object({ invites: z.boolean(), money: z.boolean(), nudges: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.port.updateNotifications(ctx.viewer.id, input);
    }),

  /** False means it was the last one and nothing changed — a refusal, not an error. */
  unlinkSignIn: protectedProcedure
    .input(z.object({ accountId: z.string().min(1) }))
    .mutation(({ ctx, input }) => ctx.port.unlinkSignIn(ctx.viewer.id, input.accountId)),

  /** The one irreversible thing on the account. Its own name, no input to get wrong. */
  deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.port.deleteMyAccount(ctx.viewer.id);
  }),
});
