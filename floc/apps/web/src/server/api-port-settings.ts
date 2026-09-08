/**
 * The port's settings half (tickets 07, 46, 236; split out of `api-port.ts`).
 *
 * SAME MODULES THE PAGES USE. Every read and write here goes through
 * `server/profile`, `server/auth` and `server/roster` — the ones `/settings`
 * and `/profile` already call. Nothing is reimplemented for the phone, which
 * is the whole point of the seam: a rule with two implementations is a rule
 * with two behaviours.
 *
 * ITS OWN FILE BECAUSE `api-port.ts` WAS FULL. The trip half and the account
 * half are two subjects, and a file whose name needs "and" is two files.
 */
import "server-only";

import { headers } from "next/headers";

import type { FlocPort, MySettings } from "@floc/api/port";

import { parseDietFlags, readDietFlags } from "@floc/core/dietary";
import { parseVibeTags, readVibeTags } from "@floc/core/vibe-tags";
import { auth, listLinkedAccounts, unlinkAccountById } from "@/server/auth";
import { refresh } from "@/server/freshness";
import { ensureProfile, loadIdentity, updateProfileFields } from "@/server/profile";
import { handOverAndLeaveAllTrips } from "@/server/roster";

type SettingsPort = Pick<
  FlocPort,
  | "loadMySettings"
  | "updateIdentity"
  | "updatePrivacy"
  | "updateVibeTags"
  | "updateDietary"
  | "updatePackingDefaults"
  | "updateHomeCurrency"
  | "updateNotifications"
  | "unlinkSignIn"
  | "deleteMyAccount"
>;

export const settingsPort: SettingsPort = {
  async loadMySettings(viewerId): Promise<MySettings> {
    // The lazy row first, so somebody who has never opened settings on the web
    // reads back defaults rather than a hole.
    const profile = await ensureProfile(viewerId);
    const [identity, linked] = await Promise.all([
      loadIdentity(viewerId),
      listLinkedAccounts(viewerId),
    ]);
    // The session proved this id a moment ago; a missing row is the account
    // being deleted mid-request, not an ordinary state.
    if (!identity) throw new Error("No such account.");

    return {
      email: identity.email,
      displayName: identity.name,
      avatarUrl: profile.avatarUrl,
      isPrivate: profile.isPrivate,
      visibilityPicture: profile.visibilityPicture,
      visibilityVibeTags: profile.visibilityVibeTags,
      visibilityTravelMap: profile.visibilityTravelMap,
      visibilityFriends: profile.visibilityFriends,
      pastTripsShow: profile.pastTripsShow,
      vibeTags: readVibeTags(profile.vibeTags),
      dietFlags: readDietFlags(profile.dietFlags),
      dietaryNotes: profile.dietaryNotes,
      shareDietary: profile.shareDietary,
      packTier: profile.packTier,
      packAutoGenerate: profile.packAutoGenerate,
      homeCurrency: profile.homeCurrency,
      notifyInvites: profile.notifyInvites,
      notifyMoney: profile.notifyMoney,
      notifyNudges: profile.notifyNudges,
      signInMethods: linked.map((a) => ({ id: a.id, provider: a.providerId })),
    };
  },

  async updateIdentity(viewerId, input) {
    await ensureProfile(viewerId);
    await updateProfileFields(viewerId, {
      displayName: input.displayName,
      avatarUrl: input.avatarUrl,
    });
    // The name and face ride on every roster and every expense line, so every
    // page showing this person is now stale.
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

  async updateDietary(viewerId, input) {
    await ensureProfile(viewerId);
    const flags = parseDietFlags(input.flags);
    await updateProfileFields(viewerId, {
      dietFlags: flags.length ? flags : null,
      dietaryNotes: input.notes,
      shareDietary: input.share,
    });
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
      notifyInvites: input.invites,
      notifyMoney: input.money,
      notifyNudges: input.nudges,
    });
  },

  async unlinkSignIn(viewerId, accountId) {
    const linked = await listLinkedAccounts(viewerId);
    // Refused, not obeyed: without a method there is no way back in.
    if (linked.length <= 1) return false;

    const target = linked.find((a) => a.id === accountId);
    if (!target) return false;

    await unlinkAccountById(target.id);
    refresh({ kind: "accountSettings" });
    return true;
  },

  async deleteMyAccount(viewerId) {
    // Order matters: hand over any trip this person solely admins first, so
    // none is left admin-less, then let Better Auth cascade the user rows.
    await handOverAndLeaveAllTrips(viewerId);
    await auth.api.deleteUser({ headers: await headers(), body: {} });
  },
};
