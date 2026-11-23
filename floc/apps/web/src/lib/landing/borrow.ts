import { stopsOf } from "@floc/core/trip/explore/listing-stops";
import type { PresetTrip, Region } from "@floc/core/trip/explore/preset-trips";
import { listingPrice, type ListingRates } from "@floc/core/trip/explore/listing-price";

import { tripRoute, type TripRoute } from "@/lib/explore/route/trip-route";

type BorrowStop = {
  name: string;
  nights: number;
  outs: string[];
};

export type BorrowCard = {
  id: string;
  place: string;
  region: Region;
  title: string;
  nights: number;
  price: string;
  stops: BorrowStop[];
  route: TripRoute;
};

export function borrowCards(trips: PresetTrip[], ids: string[], rates: ListingRates | null = null): BorrowCard[] {
  return ids.flatMap((id) => {
    const trip = trips.find((t) => t.id === id);
    if (!trip) return [];
    return [
      {
        id: trip.id,
        place: trip.country,
        region: trip.region,
        title: trip.title,
        nights: trip.nights,
        price: listingPrice(trip, rates),
        route: tripRoute(trip),
        stops: stopsFor(trip),
      },
    ];
  });
}

export function leadFirst(trips: PresetTrip[], lead: string[]): string[] {
  const known = lead.filter((id) => trips.some((t) => t.id === id));
  return [...known, ...trips.map((t) => t.id).filter((id) => !known.includes(id))];
}

export function placeWords(place: string) {
  const [first = "", ...rest] = place.split(", ");
  return rest.length ? `${first} +${rest.length}` : first;
}

function stopsFor(trip: PresetTrip): BorrowStop[] {
  return stopsOf(trip).map(({ place, nights, dayOuts }) => ({
    name: place,
    nights,
    outs: dayOuts.map((out) => out.place),
  }));
}
