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
