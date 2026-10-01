import { formatMoney } from "@floc/core/money/money";
import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import type { TransportType } from "@floc/core/vocabulary";

/** `hop` is the move that arrives at this stop, if the listing names one. */
type BorrowStop = {
  name: string;
  nights: number;
  lat: number;
  lng: number;
  hop?: { mode: TransportType; detail: string };
};

export type BorrowCard = {
  id: string;
  place: string;
  title: string;
  nights: number;
  price: string;
  stops: BorrowStop[];
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
        stops: stopsOf(trip),
      },
    ];
  });
}

function stopsOf(trip: PresetTrip): BorrowStop[] {
  const stops: BorrowStop[] = [];
  let hop: BorrowStop["hop"];
  for (const leg of trip.legs) {
    if (leg.kind === "hop") {
      hop = { mode: leg.mode, detail: leg.detail };
      continue;
    }
    stops.push({ name: leg.place, nights: leg.nights, lat: leg.lat, lng: leg.lng, ...(hop && { hop }) });
    hop = undefined;
  }
  return stops;
}
