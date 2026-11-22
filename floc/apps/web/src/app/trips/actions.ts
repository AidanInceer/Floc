"use server";

import { redirect } from "next/navigation";

import { readOptionalIsoDate } from "@floc/core/dates/dates";
import { localPath } from "@floc/core/text/local-path";
import { renameTrip as validateAndRenameTrip } from "@/app/trip/[id]/overview/actions";
import { assertAdmin, requireTripAccess, requireUser } from "@/server/access";
import { acceptInvite, declineInvite } from "@/server/trips/invites";
import { saveTrip, startTrip } from "@/server/trips/trip-save";
import {
  setTripArchived,
  setTripMuted,
  setTripStarred,
  softDeleteTrip,
} from "@/server/trips/trips";
import { GROUP_CAP, TRIP_INVITE_CAP } from "@floc/core/people/group-ticks";

export async function createTrip(formData: FormData): Promise<void> {
  const viewer = await requireUser("/trips");

  const startDate = readOptionalIsoDate(formData.get("startDate"));
  const endDate = readOptionalIsoDate(formData.get("endDate"));
  if (startDate === undefined || endDate === undefined) {
    throw new Error("Those dates aren't days");
  }

  const tripId = await startTrip(viewer.id, {
    name: formData.get("name"), startDate, endDate, friendIds: readFriendIds(formData),
    groupIds: [...new Set(formData.getAll("groupIds").map(Number))].filter((id) => Number.isSafeInteger(id) && id > 0).slice(0, GROUP_CAP),
    places: formData.getAll("places").map(String),
  });

  redirect(`/trip/${tripId}/overview`);
}

function readFriendIds(formData: FormData): string[] {
  return [
    ...new Set(
      formData
        .getAll("friendIds")
        .map((v) => String(v))
        .filter((v) => v.length > 0 && v.length <= 64),
    ),
  ].slice(0, TRIP_INVITE_CAP);
}

export async function acceptTripInvite(formData: FormData): Promise<void> {
  const tripId = Number(formData.get("tripId"));
  const viewer = await requireUser("/trips");
  if (!Number.isInteger(tripId)) return;

  if (!(await acceptInvite(tripId, viewer.id))) return;

  redirect(`/trip/${tripId}/overview`);
}

export async function declineTripInvite(formData: FormData): Promise<void> {
  const tripId = Number(formData.get("tripId"));
  const viewer = await requireUser("/trips");
  if (!Number.isInteger(tripId)) return;

  await declineInvite(tripId, viewer.id);
}

function redirectTo(formData: FormData, fallback: string): string {
  return localPath(formData.get("redirectTo"), fallback);
}

export async function renameTripFromMenu(formData: FormData): Promise<void> {
  await validateAndRenameTrip(formData);
}

export async function setTripColor(formData: FormData): Promise<void> {
  await saveTrip(await requireTripAccess(Number(formData.get("tripId"))), { colorKey: String(formData.get("color") ?? "") });
}

export async function setTripMark(formData: FormData): Promise<void> {
  await saveTrip(await requireTripAccess(Number(formData.get("tripId"))), { mark: String(formData.get("mark") ?? "") });
}

export async function starTrip(formData: FormData): Promise<void> {
  const tripId = Number(formData.get("tripId"));
  const starred = formData.get("starred") === "true";

  const access = await requireTripAccess(tripId);
  await setTripStarred(access.trip.id, access.viewer.id, starred);
}

export async function muteTrip(formData: FormData): Promise<void> {
  const tripId = Number(formData.get("tripId"));
  const muted = formData.get("muted") === "true";

  const access = await requireTripAccess(tripId);
  await setTripMuted(access.trip.id, access.viewer.id, muted);
}

export async function archiveTrip(formData: FormData): Promise<void> {
  const tripId = Number(formData.get("tripId"));
  const access = await requireTripAccess(tripId);
  assertAdmin(access);

  await setTripArchived(access.trip.id, true);

  redirect(redirectTo(formData, "/trips/archived"));
}

export async function restoreTrip(tripId: number): Promise<void> {
  const access = await requireTripAccess(tripId);
  assertAdmin(access);

  await setTripArchived(access.trip.id, false);
}

export async function deleteTrip(formData: FormData): Promise<void> {
  const tripId = Number(formData.get("tripId"));
  const access = await requireTripAccess(tripId);
  assertAdmin(access);

  await softDeleteTrip(access.trip.id);

  redirect(redirectTo(formData, "/trips"));
}
