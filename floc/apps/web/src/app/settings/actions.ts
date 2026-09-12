"use server";

// Settings mutations: notification booleans, privacy flags, unlinking a
// sign-in method, account deletion. No theme action — Floc is light-only.
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { PAST_TRIPS_SHOW, VISIBILITIES } from "@/db/schema";
import type { PastTripsShow, Visibility } from "@/db/schema";
import { requireUser } from "@/server/access";
import { auth, listLinkedAccounts, unlinkAccountById } from "@/server/auth/auth";
import { handOverAndLeaveAllTrips } from "@/server/trips/roster";
import {
  ensureProfile,
  updateProfileFields,
} from "@/server/auth/profile";
import { refresh } from "@/server/freshness";

// Privacy lives here, not on /profile — configuration, not identity. One
// three-state ring per display attribute, plus a profile-wide override
// switch. No email flag: email is never rendered on a profile at all.
export async function updatePrivacy(formData: FormData): Promise<{ error?: string }> {
  const viewer = await requireUser();
  await ensureProfile(viewer.id);

  const ring = (name: string): Visibility | null => {
    const value = String(formData.get(name) ?? "");
    return VISIBILITIES.includes(value as Visibility) ? (value as Visibility) : null;
  };

  const vibeTags = ring("visibilityVibeTags");
  const travelMap = ring("visibilityTravelMap");
  const friends = ring("visibilityFriends");
  const show = String(formData.get("pastTripsShow") ?? "");

  if (
    !vibeTags ||
    !travelMap ||
    !friends ||
    !PAST_TRIPS_SHOW.includes(show as PastTripsShow)
  ) {
    return { error: "That isn't one of the visibility options." };
  }

  await updateProfileFields(viewer.id, {
    isPrivate: formData.get("isPrivate") === "on",
    visibilityVibeTags: vibeTags,
    visibilityTravelMap: travelMap,
    visibilityFriends: friends,
    pastTripsShow: show as PastTripsShow,
  });

  refresh({ kind: "profile" });
  return {};
}

// Refuses to remove your last remaining sign-in method — otherwise the
// account would have no way back in.
export async function unlinkAccount(formData: FormData): Promise<{ error?: string }> {
  const viewer = await requireUser();
  const accountId = String(formData.get("accountId") ?? "");

  const linked = await listLinkedAccounts(viewer.id);

  if (linked.length <= 1) {
    return { error: "You can't unlink your last sign-in method." };
  }

  const target = linked.find((a) => a.id === accountId);
  if (!target) return { error: "That sign-in method isn't linked." };

  await unlinkAccountById(target.id);

  refresh({ kind: "accountSettings" });
  return {};
}

export async function updateNotifications(formData: FormData): Promise<void> {
  const viewer = await requireUser();
  await ensureProfile(viewer.id);
  await updateProfileFields(viewer.id, {
    notifyInvites: formData.get("notifyInvites") === "on",
    notifyMoney: formData.get("notifyMoney") === "on",
    notifyNudges: formData.get("notifyNudges") === "on",
  });
}

// Order: 1) auto-promote the earliest-joined remaining member of any trip
// where the viewer is sole admin, so it isn't left admin-less; 2) soft-delete
// the viewer's memberships; 3) Better Auth's delete cascades user/session/
// account rows (the one hard delete here, on Better Auth's tables only).
// Notes, day_events and expense_split rows are left untouched
// and stay attributed to the "deleted user" placeholder (a display fallback,
// not a rewrite of created_by/paid_by).
export async function deleteAccount(): Promise<void> {
  const viewer = await requireUser();

  await handOverAndLeaveAllTrips(viewer.id);

  await auth.api.deleteUser({ headers: await headers(), body: {} });

  redirect("/login");
}
