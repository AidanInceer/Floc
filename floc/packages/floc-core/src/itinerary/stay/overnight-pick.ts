/**
 * The words under the overnight dialog's night calendar (wireframe/days-week F): how
 * long the stay is, check-in to check-out, and which decided nights it takes from
 * another stay; and the writes that save it.
 */
import { addDays, formatDate, type IsoDate } from "../../dates/dates";
import { spanLabel } from "../../dates/dates-tabs";
import { shortPlace } from "../names/place-name";

export type Night = { date: IsoDate; placeId: number | null; placeName: string | null };

type Taken = { place: string; from: IsoDate; to: IsoDate };

export function stayNights(
  nights: Night[],
  stay: { start: IsoDate; placeId: number | null },
  end: IsoDate,
): { count: number; label: string; taken: string[] } {
  const inside = nights.filter((n) => n.date >= stay.start && n.date <= end);
  const count = inside.length;
  const label = `${count} night${count === 1 ? "" : "s"}, ${spanLabel(stay.start, addDays(end, 1))}`;

  const runs: Taken[] = [];
  for (const n of inside) {
    if (n.placeId === null || n.placeId === stay.placeId || !n.placeName) continue;
    const last = runs.at(-1);
    if (last && last.place === n.placeName && addDays(last.to, 1) === n.date) last.to = n.date;
    else runs.push({ place: n.placeName, from: n.date, to: n.date });
  }
  const taken = runs.map((r) =>
    `Takes ${r.from === r.to ? formatDate(r.from) : spanLabel(r.from, r.to)} from ${shortPlace(r.place)}.`);
  return { count, label, taken };
}

type Range = { start: IsoDate; end: IsoDate };
export type StayWrite = Range & { clear: boolean };

/** The nights the dialog opens on (wireframe/days-week F): the trip's last day is check-out, not a night. */
export function stayOpening(stop: Range, tripEnd: IsoDate): Range {
  const toEnd = stop.end === tripEnd && stop.start < stop.end;
  return { start: stop.start, end: toEnd ? addDays(tripEnd, -1) : stop.end };
}

// Why: the set goes first. The server only accepts a kept place id while a day still holds it.
export function stayWrites(was: Range & { placeId: number | null }, start: IsoDate, end: IsoDate, tripEnd: IsoDate): StayWrite[] {
  const last = end === addDays(tripEnd, -1) ? tripEnd : end;
  const writes: StayWrite[] = [{ start, end: last, clear: false }];
  if (was.placeId === null) return writes;
  if (was.start < start) writes.push({ start: was.start, end: minDate(was.end, addDays(start, -1)), clear: true });
  if (was.end > last) writes.push({ start: maxDate(was.start, addDays(last, 1)), end: was.end, clear: true });
  return writes;
}

const minDate = (a: IsoDate, b: IsoDate) => (a < b ? a : b);
const maxDate = (a: IsoDate, b: IsoDate) => (a > b ? a : b);
