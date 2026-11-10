/**
 * Why: the one way a trip is made or its own fields change, for the web's actions and the phone's API
 * alike (#573). The rules a name, colour, mark and tags must pass live here, so neither door can skip one.
 */
import "server-only";

import { Refusal } from "@floc/core/errors/refusal";
import { readTripMark } from "@floc/core/trip/mark/trip-mark";
import { parseTagNames } from "@floc/core/trip/tags";
import { readTripColor } from "@floc/core/trip/trip-color";
import { readTripName } from "@floc/core/trip/trip-name";

import type { TripAccess } from "@/server/access";
import { ensureProfile } from "@/server/auth/profile";
import { refresh } from "@/server/freshness";
import { setTripWindow } from "@/server/itinerary/itinerary";
import { createTripWithAdmin, tripsHeldBy, updateTrip, type TripPatch } from "./trips";

function nameOrRefuse(raw: unknown): string {
  const read = readTripName(raw);
  if ("problem" in read) throw new Refusal(read.problem);
  return read.name;
}

/** A new trip with its maker as admin. The lazy profile row comes first: without it the roster shows a nameless admin. */
export async function startTrip(
  viewerId: string,
  input: { name: unknown; startDate: string | null; endDate: string | null },
): Promise<number> {
  const name = nameOrRefuse(input.name);
  // Why together: the count is for the trips cap, and reading it beside the profile saves a round trip.
  const [, held] = await Promise.all([ensureProfile(viewerId), tripsHeldBy(viewerId)]);
  const id = await createTripWithAdmin({ name, startDate: input.startDate, endDate: input.endDate, createdBy: viewerId }, held);
  refresh({ kind: "tripList" });
  return id;
}

export async function saveTrip(
  access: Pick<TripAccess, "trip" | "viewer">,
  input: Omit<TripPatch, "tags"> & { tags?: string[] | null },
): Promise<void> {
  const { tags, startDate, endDate, colorKey, mark, name } = input;
  const fields = {
    ...(name !== undefined ? { name: nameOrRefuse(name) } : {}),
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
  refresh({ kind: "tripHeader", tripId: access.trip.id }, { kind: "tripOverview", tripId: access.trip.id }, { kind: "tripList" });
}
