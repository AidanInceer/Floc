import "server-only";

import { readTripMark } from "@floc/core/trip/mark/trip-mark";
import { parseTagNames } from "@floc/core/trip/tags";
import { readTripColor } from "@floc/core/trip/trip-color";

import type { TripAccess } from "@/server/access";
import { refresh } from "@/server/freshness";
import { setTripWindow } from "@/server/itinerary/itinerary";
import { updateTrip, type TripPatch } from "./trips";

export async function saveTrip(
  access: Pick<TripAccess, "trip" | "viewer">,
  input: Omit<TripPatch, "tags"> & { tags?: string[] | null },
): Promise<void> {
  const { tags, startDate, endDate, colorKey, mark, ...rest } = input;
  const fields = {
    ...rest,
    ...(colorKey !== undefined ? { colorKey: readTripColor(colorKey) } : {}),
    ...(mark !== undefined ? { mark: readTripMark(mark) } : {}),
    ...(tags !== undefined ? { tags: parseTagNames(tags ?? []) } : {}),
  };
  if (startDate !== undefined || endDate !== undefined) {
    await setTripWindow(
      access.trip.id,
      startDate === undefined ? access.trip.startDate : startDate,
      endDate === undefined ? access.trip.endDate : endDate,
      access.viewer.id,
      fields,
    );
  } else {
    await updateTrip(access.trip.id, fields);
  }
  refresh({ kind: "tripHeader", tripId: access.trip.id }, { kind: "tripList" });
}
