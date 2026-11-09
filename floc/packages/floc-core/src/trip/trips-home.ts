import type { IsoDate } from "../dates/dates";

export function arrangeTripsHome<T extends { startDate: IsoDate | null }>(
  trips: readonly T[],
): { featured: T | null; later: T[]; undated: T[] } {
  const dated = trips.filter((trip) => trip.startDate !== null);
  const featured = dated.reduce<T | null>((earliest, trip) => {
    const first = earliest?.startDate;
    return trip.startDate && (!first || trip.startDate < first) ? trip : earliest;
  }, null);

  return {
    featured,
    later: dated.filter((trip) => trip !== featured),
    undated: trips.filter((trip) => trip.startDate === null),
  };
}

/** The web's My trips: every dated trip in one list, soonest first, with no featured card; undated trips apart. */
export function arrangeTripsList<T extends { startDate: IsoDate | null }>(
  trips: readonly T[],
): { dated: T[]; undated: T[] } {
  const dated = trips
    .filter((trip) => trip.startDate !== null)
    .sort((a, b) => ((a.startDate as IsoDate) < (b.startDate as IsoDate) ? -1 : 1));
  return { dated, undated: trips.filter((trip) => trip.startDate === null) };
}
