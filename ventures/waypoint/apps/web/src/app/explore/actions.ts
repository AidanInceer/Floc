"use server";

/**
 * Starting a trip from an Explore listing (ticket 39).
 *
 * The shape is the one docs/partner-trips.html set out: a new trip with the
 * listing's title as its name, its highlights seeded onto the idea board as
 * unvoted ideas, and nothing else. Ideas rather than a route or a set of days,
 * because the group still decides — a preset is something to argue with, not an
 * itinerary handed down.
 *
 * The preset is **copied, not linked**. There is no listing id on the trip and
 * no foreign key back to `PRESET_TRIPS`: a trip is the group's notebook, so
 * editing it must never touch the listing and a listing changing or being
 * withdrawn must never change a trip already started.
 *
 * `bestMonths` is deliberately not applied. Dates come from the group's own
 * availability overlap (CLAUDE.md rule 9), and a preset that pre-filled them
 * would look like the decision had already been taken.
 */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/server/access";
import { insertIdeas } from "@/server/ideas";
import { createTripWithAdmin } from "@/server/membership";
import { ensureProfile } from "@/server/profile";
import { PRESET_TRIPS } from "./preset-trips";

export async function startTripFromPreset(formData: FormData): Promise<void> {
  const viewer = await requireUser("/explore");
  const presetId = String(formData.get("presetId") ?? "");
  const preset = PRESET_TRIPS.find((p) => p.id === presetId);
  // A listing can be retired between the page rendering and the click. Nothing
  // to recover, and nothing worth an error page for — back to the list
  // (CLAUDE.md rule 11: degrade, don't crash).
  if (!preset) redirect("/explore");

  await ensureProfile(viewer.id);

  const tripId = await createTripWithAdmin({
    name: preset.title,
    // Undated, like every other new trip — see the header comment.
    startDate: null,
    endDate: null,
    createdBy: viewer.id,
  });

  // One idea per highlight, in the listing's own order.
  await insertIdeas(tripId, viewer.id, preset.highlights);

  revalidatePath("/trips");
  redirect(`/trip/${tripId}/overview`);
}
