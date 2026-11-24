"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { BookingSite, BookingSites, SiteKind } from "@floc/core/trip/booking/booking-sites";
import { VISIBILITIES } from "@/db/schema";
import type { Visibility } from "@/db/schema";
import { requireUser } from "@/server/access";
import { removeCalendarAccess } from "@/server/calendar/calendar-import";
import { disconnectApp } from "@/server/auth/connected-apps";
import { unlinkSignIn } from "@/server/auth/sign-in-methods";
import { eraseAccount } from "@/server/auth/erase-account";
import { bookingSitesOf, toggleBookingSite } from "@/server/auth/booking-sites";
import { savePrivacy } from "@/server/auth/privacy";
import { saveTravelStyle } from "@/server/auth/travel-style";
import { refresh } from "@/server/freshness";
import { saveAlertSettings, setMarketingEmailConsent } from "@/server/notifications/alert-settings";

export async function updatePrivacy(formData: FormData): Promise<{ error?: string }> {
  const viewer = await requireUser();

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

  await saveTravelStyle(viewer.id, { styleInGroupIdeas: formData.get("styleInGroupIdeas") === "on" });
  await savePrivacy(viewer.id, {
    isPrivate: formData.get("isPrivate") === "on",
    visibilityVibeTags: vibeTags,
    visibilityTravelMap: travelMap,
    visibilityFriends: friends,
    visibilitySaved: saved,
    pastTripsShow: formData.get("pastTripsLatest") === "on" ? "latest" : "all",
  });
  return {};
}

export async function unlinkAccount(formData: FormData): Promise<{ error?: string }> {
  const viewer = await requireUser();
  const refusal = await unlinkSignIn(viewer.id, String(formData.get("accountId") ?? ""));
  return refusal ? { error: refusal } : {};
}

export async function updateNotifications(formData: FormData): Promise<void> {
  const viewer = await requireUser();
  await saveAlertSettings(viewer.id, {
    notifyPush: formData.get("notifyPush") === "on",
    notifyEmail: formData.get("notifyEmail") === "on",
    notifyReminders: formData.get("notifyReminders") === "on",
    notifyNextTrip: formData.get("notifyNextTrip") === "on",
  });
}

export async function updateMarketingEmail(formData: FormData): Promise<void> {
  const viewer = await requireUser();
  await setMarketingEmailConsent(viewer.id, formData.get("marketingEmail") === "on", new Date());
  refresh({ kind: "accountSettings" });
}

export async function deleteAccount(): Promise<void> {
  const viewer = await requireUser();

  await eraseAccount(viewer.id);
  const jar = await cookies();
  for (const { name } of jar.getAll()) {
    if (name.includes("better-auth.")) jar.delete(name);
  }

  redirect("/login");
}

export async function removeGoogleCalendar(): Promise<{ error?: string }> {
  const viewer = await requireUser();
  const refusal = await removeCalendarAccess(viewer.id);
  return refusal ? { error: refusal } : {};
}

export async function disconnectConnectedApp(formData: FormData): Promise<{ error?: string }> {
  const viewer = await requireUser();
  try {
    await disconnectApp(viewer.id, String(formData.get("clientId") ?? ""));
  } catch {
    return { error: "Could not disconnect. Try again." };
  }
  refresh({ kind: "accountSettings" });
  return {};
}

export async function toggleBookingSiteAction(kind: SiteKind, site: BookingSite): Promise<BookingSites> {
  const viewer = await requireUser();
  if (kind !== "flights" && kind !== "stays") return bookingSitesOf(viewer.id);
  return toggleBookingSite(viewer.id, kind, site);
}
