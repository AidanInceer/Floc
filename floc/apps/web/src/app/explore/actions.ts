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
import { bulletDoc, saveNoteDoc } from "@/server/notes/note-doc";
import { createTripWithAdmin } from "@/server/trips/trips";
import { ensureProfile } from "@/server/auth/profile";
import { refresh } from "@/server/freshness";
import { PRESET_TRIPS } from "@floc/core/trip/preset-trips";

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
  });

  if (preset.highlights.length > 0) {
    await saveNoteDoc(tripId, viewer.id, bulletDoc(preset.highlights));
  }

  refresh({ kind: "tripList" });
  redirect(`/trip/${tripId}/overview`);
}
