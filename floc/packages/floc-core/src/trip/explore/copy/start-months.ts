import { addDays, type IsoDate } from "../../../dates/dates";
import { monthsOf } from "../finder/best-months";
import type { PresetTrip } from "../preset-trip-types";

type Listing = Pick<PresetTrip, "nights" | "bestMonths">;

export type StartMonth = { month: number; year: number; startDate: IsoDate; endDate: IsoDate };

function firstAhead(month: number, today: IsoDate): { year: number; startDate: IsoDate } {
  const year = Number(today.slice(0, 4));
  const first = (y: number) => `${y}-${String(month).padStart(2, "0")}-01`;
  return first(year) > today ? { year, startDate: first(year) } : { year: year + 1, startDate: first(year + 1) };
}

/** The months a copy may start in (ADR-025): the listing's best months, each on the next 1st still ahead. */
export function startMonths(listing: Listing, today: IsoDate): StartMonth[] {
  return monthsOf(listing.bestMonths)
    .map((month) => {
      const { year, startDate } = firstAhead(month, today);
      return { month, year, startDate, endDate: addDays(startDate, listing.nights) };
    })
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/** The dates a copy gets for `month`, or null when the listing does not name that month. */
export function copyWindow(listing: Listing, month: number, today: IsoDate): { startDate: IsoDate; endDate: IsoDate } | null {
  const hit = startMonths(listing, today).find((m) => m.month === month);
  return hit ? { startDate: hit.startDate, endDate: hit.endDate } : null;
}

/** The dates a copy gets: the picked start day while it is still ahead, else an older app's best month, else none. */
export function windowOf(
  listing: Listing,
  pick: { startDate: IsoDate | null; month: number | null },
  today: IsoDate,
): { startDate: IsoDate; endDate: IsoDate } | null {
  if (pick.startDate !== null) return pick.startDate > today ? { startDate: pick.startDate, endDate: addDays(pick.startDate, listing.nights) } : null;
  return pick.month === null ? null : copyWindow(listing, pick.month, today);
}
