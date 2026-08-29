"use server";

/**
 * Starts a trip from an Explore listing: new trip named after the listing,
 * its highlights seeded onto the idea board as unvoted ideas, nothing else
 * — the group still decides. Copied, not linked: no listing id or FK back to
 * `PRESET_TRIPS`, so editing the trip never touches the listing and vice
 * versa. `bestMonths` is deliberately not applied — dates come from the
 * group's own availability overlap (rule 9).
 */
import { redirect } from "next/navigation";

import { requireUser } from "@/server/access";
import { insertIdeas } from "@/server/ideas";
import { createTripWithAdmin } from "@/server/trips";
import { ensureProfile } from "@/server/profile";
import { refresh } from "@/server/freshness";
import { PRESET_TRIPS } from "./preset-trips";

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

  await insertIdeas(tripId, viewer.id, preset.highlights);

  refresh({ kind: "tripList" });
  redirect(`/trip/${tripId}/overview`);
}
