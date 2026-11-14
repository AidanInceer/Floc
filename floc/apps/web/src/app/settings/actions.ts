"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { BookingSite, BookingSites, SiteKind } from "@floc/core/trip/booking/booking-sites";
import { VISIBILITIES } from "@/db/schema";
import type { Visibility } from "@/db/schema";
import { requireUser } from "@/server/access";
import { removeCalendarAccess } from "@/server/calendar/calendar-import";
import { unlinkSignIn } from "@/server/auth/sign-in-methods";
import { eraseAccount } from "@/server/auth/erase-account";
import { bookingSitesOf, toggleBookingSite } from "@/server/auth/booking-sites";
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
  const saved = ring("visibilitySaved");
  if (!vibeTags || !travelMap || !friends || !saved) {
    return { error: "That isn't one of the visibility options." };
  }

  await updateProfileFields(viewer.id, {
    isPrivate: formData.get("isPrivate") === "on",
    visibilityVibeTags: vibeTags,
    visibilityTravelMap: travelMap,
    visibilityFriends: friends,
    visibilitySaved: saved,
    pastTripsShow: formData.get("pastTripsLatest") === "on" ? "latest" : "all",
  });

  refresh({ kind: "profile" });
  return {};
}

export async function unlinkAccount(formData: FormData): Promise<{ error?: string }> {
  const viewer = await requireUser();
  const refusal = await unlinkSignIn(viewer.id, String(formData.get("accountId") ?? ""));
  if (refusal) return { error: refusal };

  refresh({ kind: "accountSettings" });
  return {};
}

export async function updateNotifications(formData: FormData): Promise<void> {
  const viewer = await requireUser();
  await ensureProfile(viewer.id);
  await updateProfileFields(viewer.id, {
    notifyPush: formData.get("notifyPush") === "on",
    notifyEmail: formData.get("notifyEmail") === "on",
    notifyReminders: formData.get("notifyReminders") === "on",
    notifyNextTrip: formData.get("notifyNextTrip") === "on",
  });
}

export async function deleteAccount(): Promise<void> {
  const viewer = await requireUser();

  await eraseAccount(viewer.id);
  // Why: the cookie cache would keep a dead session readable for up to a minute.
  const jar = await cookies();
  for (const { name } of jar.getAll()) {
    if (name.includes("better-auth.")) jar.delete(name);
  }

  redirect("/login");
}

// Revokes Floc's calendar access at Google, then forgets it (#444, ADR-031). The account and its sign-in stay.
export async function removeGoogleCalendar(): Promise<{ error?: string }> {
  const viewer = await requireUser();
  const refusal = await removeCalendarAccess(viewer.id);
  if (refusal) return { error: refusal };

  refresh({ kind: "accountSettings" });
  return {};
}

/** A tick in a booking-site menu: the rules sit in @floc/core, so an unknown site or kind changes nothing. */
export async function toggleBookingSiteAction(kind: SiteKind, site: BookingSite): Promise<BookingSites> {
  const viewer = await requireUser();
  if (kind !== "flights" && kind !== "stays") return bookingSitesOf(viewer.id);
  return toggleBookingSite(viewer.id, kind, site);
}
