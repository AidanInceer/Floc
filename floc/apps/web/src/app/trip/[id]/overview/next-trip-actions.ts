"use server";

import { redirect } from "next/navigation";

import { isRefusal } from "@floc/core/errors/refusal";
import { requireTripAccess } from "@/server/access";
import { LIMITS } from "@/server/limits";
import { startTrip } from "@/server/trips/trip-save";

export async function planNextTrip(formData: FormData): Promise<{ error: string } | void> {
  const access = await requireTripAccess(Number(formData.get("tripId")));
  const onTrip = new Set(access.members.map((m) => m.userId));
  const friendIds = [...new Set(formData.getAll("friendIds").map(String))]
    .filter((id) => id !== access.viewer.id && onTrip.has(id))
    .slice(0, LIMITS.members);

  let tripId: number;
  try {
    tripId = await startTrip(access.viewer.id, { name: formData.get("name"), startDate: null, endDate: null, friendIds });
  } catch (error) {
    if (isRefusal(error)) return { error: error.message };
    throw error;
  }
  redirect(`/trip/${tripId}/overview`);
}
