export function shortPlace(placeName: string): string {
  return placeName.split(",")[0].trim();
}

export const STOP_NOT_SET = "Not set";
