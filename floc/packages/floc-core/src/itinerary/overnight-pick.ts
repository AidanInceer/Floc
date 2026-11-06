/**
 * The words under the overnight dialog's last-night picker (wireframe/modal-forms B3b):
 * how long the stay is, check-in to check-out, and which decided nights it takes from
 * another stay — said in a line, because the picker itself shows no place names.
 */
import { addDays, formatDate, type IsoDate } from "../dates/dates";
import { spanLabel } from "../dates/dates-tabs";

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
    `Takes ${r.from === r.to ? formatDate(r.from) : spanLabel(r.from, r.to)} from ${r.place}.`);
  return { count, label, taken };
}
