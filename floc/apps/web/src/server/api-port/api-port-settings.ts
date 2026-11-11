/**
 * Why: every read and write goes through the modules `/settings` and `/profile`
 * already call — a rule with two implementations is a rule with two behaviours.
 */
import "server-only";

import type { FlocPort, MySettings } from "@floc/api/port";

import { parseVibeTags, readVibeTags } from "@floc/core/trip/vibe-tags";
import { listSignInMethods, unlinkSignIn } from "@/server/auth/sign-in-methods";
import { refresh } from "@/server/freshness";
import { ensureProfile, loadIdentity, updateProfileFields } from "@/server/auth/profile";
import { eraseAccount } from "@/server/auth/erase-account";
import { markTourSeen, tourSeenAt } from "@/server/auth/tour";
import { toggleBookingSite } from "@/server/auth/booking-sites";
import { readBookingSites } from "@floc/core/trip/booking/booking-sites";

type SettingsPort = Pick<
  FlocPort,
  | "loadMySettings"
  | "updateIdentity"
  | "updateAvatarIcon"
  | "updatePrivacy"
  | "updateVibeTags"
  | "updatePackingDefaults"
  | "updateHomeCurrency"
  | "toggleBookingSite"
  | "updateNotifications"
  | "unlinkSignIn"
  | "deleteMyAccount"
  | "tourSeen"
  | "markTourSeen"
>;

export const settingsPort: SettingsPort = {
  async tourSeen(viewerId) {
    return (await tourSeenAt(viewerId)) !== null;
  },

  markTourSeen: (viewerId) => markTourSeen(viewerId),

  async loadMySettings(viewerId): Promise<MySettings> {
    // The lazy row first, so somebody who has never opened settings on the web
    // reads back defaults rather than a hole.
    const profile = await ensureProfile(viewerId);
    const [identity, linked] = await Promise.all([
      loadIdentity(viewerId),
      listSignInMethods(viewerId),
    ]);
    // The session proved this id a moment ago; a missing row is the account
    // being deleted mid-request, not an ordinary state.
    if (!identity) throw new Error("No such account.");

    return {
      email: identity.email,
      displayName: identity.name,
      avatarIcon: profile.avatarIcon,
      isPrivate: profile.isPrivate,
      visibilityVibeTags: profile.visibilityVibeTags,
      visibilityTravelMap: profile.visibilityTravelMap,
      visibilityFriends: profile.visibilityFriends,
      visibilitySaved: profile.visibilitySaved,
      pastTripsShow: profile.pastTripsShow,
      vibeTags: readVibeTags(profile.vibeTags),
      packTier: profile.packTier,
      packAutoGenerate: profile.packAutoGenerate,
      homeCurrency: profile.homeCurrency,
      notifyPush: profile.notifyPush,
      notifyEmail: profile.notifyEmail,
      notifyReminders: profile.notifyReminders,
      signInMethods: linked.map((a) => ({ id: a.id, provider: a.providerId })),
      bookingSites: readBookingSites(profile.bookingSites),
    };
  },

  toggleBookingSite: (viewerId, kind, site) => toggleBookingSite(viewerId, kind, site),

  async updateIdentity(viewerId, input) {
    await ensureProfile(viewerId);
    await updateProfileFields(viewerId, { displayName: input.displayName });
    // The name and face ride on every roster and every expense line, so every
    // page showing this person is now stale.
    refresh({ kind: "profile" });
    refresh({ kind: "tripList" });
  },

  async updateAvatarIcon(viewerId, icon) {
    await ensureProfile(viewerId);
    await updateProfileFields(viewerId, { avatarIcon: icon });
    refresh({ kind: "profile" });
    refresh({ kind: "tripList" });
  },

  async updatePrivacy(viewerId, input) {
    await ensureProfile(viewerId);
    await updateProfileFields(viewerId, input);
    refresh({ kind: "profile" });
  },

  async updateVibeTags(viewerId, tags) {
    await ensureProfile(viewerId);
    // Re-checked against the seed list even though the router already did:
    // this is the function the web's action calls too, and the guard belongs
    // where the write is.
    const picked = parseVibeTags(tags);
    await updateProfileFields(viewerId, { vibeTags: picked.length ? picked : null });
    refresh({ kind: "profile" });
  },

  async updatePackingDefaults(viewerId, input) {
    await ensureProfile(viewerId);
    await updateProfileFields(viewerId, {
      packTier: input.tier,
      packAutoGenerate: input.autoGenerate,
    });
    refresh({ kind: "profile" });
  },

  async updateHomeCurrency(viewerId, currency) {
    await ensureProfile(viewerId);
    await updateProfileFields(viewerId, { homeCurrency: currency });
    refresh({ kind: "profile" });
  },

  async updateNotifications(viewerId, input) {
    await ensureProfile(viewerId);
    await updateProfileFields(viewerId, {
      notifyPush: input.push,
      notifyEmail: input.email,
      notifyReminders: input.reminders,
    });
  },

  async unlinkSignIn(viewerId, accountId) {
    // Refused, not obeyed: without a method there is no way back in.
    if (await unlinkSignIn(viewerId, accountId)) return false;
    refresh({ kind: "accountSettings" });
    return true;
  },

  async deleteMyAccount(viewerId) {
    await eraseAccount(viewerId);
  },
};
