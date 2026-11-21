import "server-only";

import type { FlocPort, MySettings } from "@floc/api/port";

import { parseVibeTags, readVibeTags } from "@floc/core/trip/vibe-tags";
import { listSignInMethods, unlinkSignIn } from "@/server/auth/sign-in-methods";
import { refresh } from "@/server/freshness";
import { ensureProfile, loadIdentity, updateProfileFields } from "@/server/auth/profile";
import { eraseAccount } from "@/server/auth/erase-account";
import { finishWelcome, welcomeFor } from "@/server/auth/welcome/welcome";
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
  | "updateReduceMotion"
  | "toggleBookingSite"
  | "updateNotifications"
  | "unlinkSignIn"
  | "deleteMyAccount"
  | "welcome"
  | "finishWelcome"
>;

export const settingsPort: SettingsPort = {
  welcome: (viewerId) => welcomeFor(viewerId),

  finishWelcome: (viewerId, answers) => finishWelcome(viewerId, answers),

  async loadMySettings(viewerId): Promise<MySettings> {
    const profile = await ensureProfile(viewerId);
    const [identity, linked] = await Promise.all([
      loadIdentity(viewerId),
      listSignInMethods(viewerId),
    ]);
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
      reduceMotion: profile.reduceMotion,
      homeCurrency: profile.homeCurrency,
      notifyPush: profile.notifyPush,
      notifyEmail: profile.notifyEmail,
      notifyReminders: profile.notifyReminders,
      notifyNextTrip: profile.notifyNextTrip,
      signInMethods: linked.map((a) => ({ id: a.id, provider: a.providerId })),
      bookingSites: readBookingSites(profile.bookingSites),
    };
  },

  toggleBookingSite: (viewerId, kind, site) => toggleBookingSite(viewerId, kind, site),

  async updateIdentity(viewerId, input) {
    await ensureProfile(viewerId);
    await updateProfileFields(viewerId, { displayName: input.displayName });
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

  async updateReduceMotion(viewerId, reduceMotion) {
    await ensureProfile(viewerId);
    await updateProfileFields(viewerId, { reduceMotion });
    refresh({ kind: "profile" });
  },

  async updateNotifications(viewerId, input) {
    await ensureProfile(viewerId);
    await updateProfileFields(viewerId, {
      notifyPush: input.push,
      notifyEmail: input.email,
      notifyReminders: input.reminders,
      ...(input.nextTrip === undefined ? {} : { notifyNextTrip: input.nextTrip }),
    });
  },

  async unlinkSignIn(viewerId, accountId) {
    if (await unlinkSignIn(viewerId, accountId)) return false;
    refresh({ kind: "accountSettings" });
    return true;
  },

  async deleteMyAccount(viewerId) {
    await eraseAccount(viewerId);
  },
};
