import { countWord } from "../text/count-word";

export type StopDayInput = {
  dayId: number;
  date: string;
  overnightPlaceId: number | null;
  overnightPlaceName: string | null;
};

export type Stop = {
  placeId: number | null;
  placeName: string | null;
  startDate: string;
  endDate: string;
  nights: number;
  dayIds: number[];
};

export function placedStops(stops: Stop[]): Stop[] {
  return stops.filter((s) => s.placeId !== null);
}

export function nightsLabel(nights: number): string {
  if (nights === 0) return "Day home";
  return countWord(nights, "night");
}

export function deriveStops(days: StopDayInput[], tripEnd?: string | null): Stop[] {
  const stops: Stop[] = [];

  for (const d of days) {
    const last = stops[stops.length - 1];
    if (last && last.placeId === d.overnightPlaceId) {
      last.endDate = d.date;
      last.dayIds.push(d.dayId);
      continue;
    }
    stops.push({
      placeId: d.overnightPlaceId,
      placeName: d.overnightPlaceName,
      startDate: d.date,
      endDate: d.date,
      nights: 0,
      dayIds: [d.dayId],
    });
  }

  for (const s of stops) s.nights = s.dayIds.length;
  const last = stops[stops.length - 1];
  if (last && (!tripEnd || last.endDate >= tripEnd)) last.nights -= 1;

  return stops;
}
