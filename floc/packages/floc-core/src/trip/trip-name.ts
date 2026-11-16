import { asText, properCase, TEXT_CAPS } from "../text/text";

export const NO_TRIP_NAME = "A trip needs a name.";
export const TRIP_NAME_TOO_LONG = "That name is too long.";

export function readTripName(raw: unknown): { name: string } | { problem: string } {
  const name = properCase(asText(raw).trim());
  if (!name) return { problem: NO_TRIP_NAME };
  return name.length > TEXT_CAPS.tripName ? { problem: TRIP_NAME_TOO_LONG } : { name };
}
