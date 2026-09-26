import { formatMoney } from "@floc/core/money/money";
import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";

type BorrowStop = { name: string; nights: number; lat: number; lng: number };

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
        stops: trip.legs.flatMap((l) => (l.kind === "base" ? [{ name: l.place, nights: l.nights, lat: l.lat, lng: l.lng }] : [])),
      },
    ];
  });
}
