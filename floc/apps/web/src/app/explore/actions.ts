"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/server/access";
import { readCopyForm } from "@floc/core/trip/explore/copy/copy-choice";
import { startTripFromListing } from "@/server/explore/listing-copy";
import { readFinder } from "@floc/core/trip/explore/finder/finder-read";
import { saveFinder } from "@/server/explore/explore-finder";
import { setTripSaved } from "@/server/explore/explore-saves";
import { TRIP_INVITE_CAP } from "@floc/core/people/group-ticks";

export async function rememberFinder(value: unknown): Promise<void> {
  const viewer = await requireUser("/explore");
  const finder = readFinder(value);
  if (finder) await saveFinder(viewer.id, finder);
}

export async function startTripFromPreset(formData: FormData): Promise<void> {
  const viewer = await requireUser("/explore");
  const along = [...new Set(formData.getAll("friendIds").map(String))].filter((id) => id && id.length <= 64).slice(0, TRIP_INVITE_CAP);
  const tripId = await startTripFromListing(viewer.id, readCopyForm(formData), along);
  if (tripId === null) redirect("/explore");
  redirect(`/trip/${tripId}/overview`);
}

export async function saveTrip(presetId: string, saved: boolean): Promise<void> {
  const viewer = await requireUser(`/explore/${presetId}?save=${presetId}`);
  await setTripSaved(viewer.id, presetId, saved);
}
