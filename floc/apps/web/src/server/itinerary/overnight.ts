import { isIsoDate } from "@floc/core/dates/dates";
import { capText } from "@floc/core/text/text";

import {
  listDays,
  listOvernightPlaces,
  setOvernightPlaceOn,
  type ItineraryDay,
} from "@/server/itinerary/itinerary";
import { refresh } from "@/server/freshness";
import { upsertPlace } from "@/server/itinerary/places";

export type OvernightPlaceInput =
  | { placeId: number }
  | {
      name: string;
      providerId?: string | null;
      lat?: number | null;
      lng?: number | null;
      countryCode?: string | null;
    };

export async function applyOvernight(
  tripId: number,
  startDate: string,
  endDate: string,
  place: OvernightPlaceInput | null,
): Promise<boolean> {
  if (!isIsoDate(startDate) || !isIsoDate(endDate)) return false;
  if (endDate < startDate) return false;

  const days = await listDays(tripId);
  const targets = days.filter((d) => d.date >= startDate && d.date <= endDate);
  if (targets.length === 0) return false;

  const placeId = place === null ? null : await resolveOvernightPlace(tripId, days, place);
  if (place !== null && placeId === null) return false;

  await setOvernightPlaceOn(
    tripId,
    targets.map((d) => d.id),
    placeId,
  );
  refresh({ kind: "itinerary", tripId });
  return true;
}

async function resolveOvernightPlace(
  tripId: number,
  days: ItineraryDay[],
  place: OvernightPlaceInput,
): Promise<number | null> {
  if ("placeId" in place) {
    return days.some((d) => d.overnightPlaceId === place.placeId) ? place.placeId : null;
  }
  const name = capText(place.name, "placeName");
  if (!name) return null;

  if (!place.providerId) {
    const known = (await listOvernightPlaces(tripId)).find(
      (p) => p.name.toLowerCase() === name.toLowerCase(),
    );
    if (known) return known.id;
  }

  return upsertPlace({
    providerId: place.providerId ?? null,
    name,
    lat: place.lat ?? null,
    lng: place.lng ?? null,
    countryCode: place.countryCode ?? null,
  });
}
