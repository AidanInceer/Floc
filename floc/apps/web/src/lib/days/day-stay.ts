import { deriveStops } from "@floc/core/itinerary/stops";

type StayDay = { id: number; date: string; overnightPlaceId: number | null; overnightPlaceName: string | null };

export function dayStay(days: StayDay[], index: number, tripEnd: string | null): { night: number | null; nights: number } {
  const day = days[index];
  const stops = deriveStops(
    days.map((d) => ({ dayId: d.id, date: d.date, overnightPlaceId: d.overnightPlaceId, overnightPlaceName: d.overnightPlaceName })),
    tripEnd,
  );
  const stop = stops.find((s) => s.dayIds.includes(day.id))!;
  const dayHome = index === days.length - 1 && (!tripEnd || day.date >= tripEnd);
  return { night: dayHome ? null : stop.dayIds.indexOf(day.id) + 1, nights: stop.nights };
}
