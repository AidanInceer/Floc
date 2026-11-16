"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/server/access";
import { readCopyForm } from "@floc/core/trip/explore/copy/copy-choice";
import { copyListing } from "@/server/explore/listing-copy";
import { ensureProfile } from "@/server/auth/profile";
import { refresh } from "@/server/freshness";
import { readFinder } from "@floc/core/trip/explore/finder/finder-read";
import { saveFinder } from "@/server/explore/explore-finder";
import { setTripSaved } from "@/server/explore/explore-saves";
import { inviteToTrip } from "@/server/trips/invites";
import { TRIP_INVITE_CAP } from "@floc/core/people/group-ticks";

export async function rememberFinder(value: unknown): Promise<void> {
  const viewer = await requireUser("/explore");
  const finder = readFinder(value);
  if (finder) await saveFinder(viewer.id, finder);
}

export async function startTripFromPreset(formData: FormData): Promise<void> {
  const viewer = await requireUser("/explore");
  await ensureProfile(viewer.id);
  const tripId = await copyListing(viewer.id, readCopyForm(formData));
  if (tripId === null) redirect("/explore");
  const along = [...new Set(formData.getAll("friendIds").map(String))].filter((id) => id && id.length <= 64).slice(0, TRIP_INVITE_CAP);
  if (along.length && (await inviteToTrip({ tripId, fromUserId: viewer.id, toUserIds: along }))) refresh({ kind: "invites" });

  refresh({ kind: "tripList" });
  redirect(`/trip/${tripId}/overview`);
}

export async function saveTrip(presetId: string, saved: boolean): Promise<void> {
  const viewer = await requireUser(`/explore/${presetId}?save=${presetId}`);
  await setTripSaved(viewer.id, presetId, saved);
  refresh({ kind: "savedTrips" });
}
