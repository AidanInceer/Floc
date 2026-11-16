export function shortPlace(placeName: string): string {
  return placeName.split(",")[0].trim();
}
