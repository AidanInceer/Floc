"use server";

import { assertAdmin, requireTripAccess } from "@/server/access";
import {
  findTripLink,
  insertTripLink,
  readWebUrl,
  softDeleteTripLink,
} from "@/server/trips/trip-links";
import { refresh } from "@/server/freshness";

export async function addTripLink(tripId: number, formData: FormData) {
  const access = await requireTripAccess(tripId);

  const url = readWebUrl(formData.get("url"));
  if (!url) return;

  await insertTripLink({
    tripId: access.trip.id,
    createdBy: access.viewer.id,
    url,
    label: String(formData.get("label") ?? ""),
  });

  refresh({ kind: "tripLinks", tripId: access.trip.id });
}

export async function removeTripLink(tripId: number, linkId: number) {
  const access = await requireTripAccess(tripId);

  const target = await findTripLink(access.trip.id, linkId);
  if (!target) return;
  if (target.createdBy !== access.viewer.id) assertAdmin(access);

  await softDeleteTripLink(target.id);
  refresh({ kind: "tripLinks", tripId: access.trip.id });
}
