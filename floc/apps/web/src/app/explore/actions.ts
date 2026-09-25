"use server";

/**
 * Starts a trip from an Explore listing: new trip named after the listing,
 * its highlights seeded into the trip's Notes doc as bullets, nothing else
 * — the group still decides. Copied, not linked: no listing id or FK back to
 * `PRESET_TRIPS`, so editing the trip never touches the listing and vice
 * versa. `bestMonths` is deliberately not applied — dates come from the
 * group's own availability overlap (rule 9).
 */
import { redirect } from "next/navigation";

import { requireUser } from "@/server/access";
import { bulletPage } from "@floc/core/notes/pages/page-blocks";
import { createTripWithAdmin } from "@/server/trips/trips";
import { ensureProfile } from "@/server/auth/profile";
import { refresh } from "@/server/freshness";
import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import { readAnswers } from "@floc/core/trip/explore/explore-match";
import { saveAnswers } from "@/server/explore/explore-answers";

// No refresh: the page already holds the answers it just sent.
export async function rememberAnswers(value: unknown): Promise<void> {
  const viewer = await requireUser("/explore");
  const answers = readAnswers(value);
  if (answers) await saveAnswers(viewer.id, answers);
}

export async function startTripFromPreset(formData: FormData): Promise<void> {
  const viewer = await requireUser("/explore");
  const presetId = String(formData.get("presetId") ?? "");
  const preset = PRESET_TRIPS.find((p) => p.id === presetId);
  // A listing can be retired between render and click — degrade, don't crash.
  if (!preset) redirect("/explore");

  await ensureProfile(viewer.id);

  const tripId = await createTripWithAdmin({
    name: preset.title,
    startDate: null,
    endDate: null,
    createdBy: viewer.id,
    firstPage: bulletPage(preset.highlights),
  });

  refresh({ kind: "tripList" });
  redirect(`/trip/${tripId}/overview`);
}
