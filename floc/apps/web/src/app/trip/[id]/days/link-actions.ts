"use server";

/**
 * The trip's link shelf (ticket 103), beside the trip thread in the Days pane.
 *
 * The table's shape, the `http`/`https` rule, the label cap and the ceiling all
 * live in `server/trips/trip-links.ts`. What's left here is who may do what: adding
 * is open to every member, because a group planner where only admins may share
 * the ferry timetable is not a group planner; removing follows the same rule
 * threads use — your own, or any admin's, so the shelf can't be filled with
 * dead links by somebody who has since gone quiet.
 */
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

  // Validate at the door (ticket 113). A URL that isn't one is dropped rather
  // than stored: the shelf renders `href`s, so an unparseable or non-web scheme
  // must never reach the row in the first place.
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

  // Bound to the trip, or the id alone would be a way into another group's
  // shelf (rule 5). A link that isn't this trip's simply isn't found.
  const target = await findTripLink(access.trip.id, linkId);
  if (!target) return;
  if (target.createdBy !== access.viewer.id) assertAdmin(access);

  await softDeleteTripLink(target.id);
  refresh({ kind: "tripLinks", tripId: access.trip.id });
}
