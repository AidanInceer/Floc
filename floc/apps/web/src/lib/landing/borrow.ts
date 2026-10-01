import { formatMoney } from "@floc/core/money/money";
import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import type { TransportType } from "@floc/core/vocabulary";

type Hop = { mode: TransportType; detail: string };

/** `hop` is the move that arrives at this stop, if the listing names one. */
type BorrowStop = {
  name: string;
  nights: number;
  lat: number;
  lng: number;
  hop?: Hop;
};

/** `also` is a day trip from the last base: a move that ends the listing with no night of its own. */
export type BorrowCard = {
  id: string;
  place: string;
  title: string;
  nights: number;
  price: string;
  stops: BorrowStop[];
  also?: Hop & { place: string };
};

/** The listings the landing page rolls through, in the order given; a retired id is skipped. */
export function borrowCards(trips: PresetTrip[], ids: string[]): BorrowCard[] {
  return ids.flatMap((id) => {
    const trip = trips.find((t) => t.id === id);
    if (!trip) return [];
    return [
      {
        id: trip.id,
        place: trip.country,
        title: trip.title,
        nights: trip.nights,
        price: formatMoney(trip.priceFromMinor, trip.currency),
        ...routeOf(trip),
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

export const nightsWords = (n: number) => `${n} ${n === 1 ? "night" : "nights"}`;

function routeOf(trip: PresetTrip): Pick<BorrowCard, "stops" | "also"> {
  const stops: BorrowStop[] = [];
  let hop: (Hop & { place: string }) | undefined;
  for (const leg of trip.legs) {
    if (leg.kind === "hop") {
      hop = { place: leg.place, mode: leg.mode, detail: leg.detail };
      continue;
    }
    stops.push({ name: leg.place, nights: leg.nights, lat: leg.lat, lng: leg.lng, ...(hop && { hop: { mode: hop.mode, detail: hop.detail } }) });
    hop = undefined;
  }
  return hop ? { stops, also: hop } : { stops };
}
