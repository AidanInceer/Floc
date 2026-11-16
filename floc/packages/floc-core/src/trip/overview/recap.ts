import { formatMonth } from "../../dates/availability";
import { nightsBetween, type IsoDate } from "../../dates/dates";
import { countWord } from "../../text/count-word";

export function recapShows(endDate: IsoDate | null, today: IsoDate): boolean {
  return endDate !== null && endDate < today;
}

export type RecapCard = { name: string; month: string; stops: { no: number; place: string; nights: number }[]; foot: string };

const monthWord = (iso: IsoDate) => formatMonth(iso.slice(0, 7)).split(" ")[0];

function monthsOf(start: IsoDate, end: IsoDate): string {
  const [from, to] = [formatMonth(start.slice(0, 7)), formatMonth(end.slice(0, 7))];
  if (from === to) return from;
  return start.slice(0, 4) === end.slice(0, 4) ? `${monthWord(start)} – ${to}` : `${from} – ${to}`;
}

export function recapCard(input: { name: string; startDate: IsoDate; endDate: IsoDate; stops: readonly { place: string; nights: number }[] }): RecapCard {
  const nights = nightsBetween(input.startDate, input.endDate);
  const places = new Set(input.stops.map((s) => s.place)).size;
  return {
    name: input.name,
    month: monthsOf(input.startDate, input.endDate),
    stops: input.stops.map((s, i) => ({ no: i + 1, place: s.place, nights: s.nights })),
    foot: `${countWord(nights, "night")} · ${countWord(places, "place")}`,
  };
}
