import "server-only";

import type { FlocPort, MySettings } from "@floc/api/port";

import { parseVibeTags, readVibeTags } from "@floc/core/trip/vibe-tags";
import { listSignInMethods, unlinkSignIn } from "@/server/auth/sign-in-methods";
import { ensureProfile, loadIdentity, saveFace, saveProfile, updateProfileFields } from "@/server/auth/profile";
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

  updateIdentity: (viewerId, input) => saveFace(viewerId, { displayName: input.displayName }),

  updateAvatarIcon: (viewerId, icon) => saveFace(viewerId, { avatarIcon: icon }),

  updatePrivacy: (viewerId, input) => saveProfile(viewerId, input),

  async updateVibeTags(viewerId, tags) {
    const picked = parseVibeTags(tags);
    await saveProfile(viewerId, { vibeTags: picked.length ? picked : null });
  },

  updatePackingDefaults: (viewerId, input) => saveProfile(viewerId, { packTier: input.tier }),

  updateHomeCurrency: (viewerId, currency) => saveProfile(viewerId, { homeCurrency: currency }),

  updateReduceMotion: (viewerId, reduceMotion) => saveProfile(viewerId, { reduceMotion }),

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
    return !(await unlinkSignIn(viewerId, accountId));
  },

  async deleteMyAccount(viewerId) {
    await eraseAccount(viewerId);
  },
};
