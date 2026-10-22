"use server";

/**
 * Starts a trip from an Explore listing (ADR-025): the month, ideas and events
 * picked in the copy sheet. Copied, not linked: no listing id or FK back to
 * `PRESET_TRIPS`, so editing the trip never touches the listing and vice versa.
 */
import { redirect } from "next/navigation";

import { requireUser } from "@/server/access";
import { readCopyForm } from "@floc/core/trip/explore/copy/copy-choice";
import { copyListing } from "@/server/explore/listing-copy";
import { ensureProfile } from "@/server/auth/profile";
import { refresh } from "@/server/freshness";
import { readFinder } from "@floc/core/trip/explore/finder/finder-read";
import { saveFinder } from "@/server/explore/explore-finder";

// No refresh: the page already holds the finder it just sent.
export async function rememberFinder(value: unknown): Promise<void> {
  const viewer = await requireUser("/explore");
  const finder = readFinder(value);
  if (finder) await saveFinder(viewer.id, finder);
}

export async function startTripFromPreset(formData: FormData): Promise<void> {
  const viewer = await requireUser("/explore");
  await ensureProfile(viewer.id);
  const tripId = await copyListing(viewer.id, readCopyForm(formData));
  // A listing can be retired between render and click — degrade, don't crash.
  if (tripId === null) redirect("/explore");

  refresh({ kind: "tripList" });
  redirect(`/trip/${tripId}/overview`);
}
