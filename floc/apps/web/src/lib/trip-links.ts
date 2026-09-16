export function dayHref(tripId: number, date: string): string {
  return `/trip/${tripId}/days?date=${encodeURIComponent(date)}`;
}
