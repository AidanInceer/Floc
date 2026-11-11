import { stopsOf } from "@floc/core/trip/explore/listing-stops";
import type { PresetTrip, Region } from "@floc/core/trip/explore/preset-trips";
import type { TransportType } from "@floc/core/vocabulary";
import { listingPrice, type ListingRates } from "@floc/core/trip/explore/listing-price";

import { tripRoute, type TripRoute } from "@/lib/explore/route/trip-route";

type Hop = { mode: TransportType; detail: string };

/** `hop` is the move that arrives at this stop, if the listing names one; `outs` are the day outs made from it. */
type BorrowStop = {
  name: string;
  nights: number;
  lat: number;
  lng: number;
  hop?: Hop;
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

/** The listings the landing page rolls through, in the order given; a retired id is skipped. */
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

/** Every listing's id: the lead ones first, in the order given, then the rest as Explore lists them. */
export function leadFirst(trips: PresetTrip[], lead: string[]): string[] {
  const known = lead.filter((id) => trips.some((t) => t.id === id));
  return [...known, ...trips.map((t) => t.id).filter((id) => !known.includes(id))];
}

export const hopWords = ({ mode, detail }: Hop) =>
  mode === "other" ? detail : `${mode[0]!.toUpperCase()}${mode.slice(1)}, ${detail}`;

export function placeWords(place: string) {
  const [first = "", ...rest] = place.split(", ");
  return rest.length ? `${first} +${rest.length}` : first;
}

export const nightsWords = (n: number) => `${n} ${n === 1 ? "night" : "nights"}`;

function stopsFor(trip: PresetTrip): BorrowStop[] {
  return stopsOf(trip).map(({ place, nights, lat, lng, arrive, dayOuts }) => ({
    name: place,
    nights,
    lat,
    lng,
    ...(arrive && { hop: { mode: arrive.mode, detail: arrive.detail } }),
    outs: dayOuts.map((out) => out.place),
  }));
}
