/** A geocoded place is a full address chain; screens show its first part. */
export function shortPlace(placeName: string): string {
  return placeName.split(",")[0].trim();
}
