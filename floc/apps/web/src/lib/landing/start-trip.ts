import { TEXT_CAPS } from "@floc/core/text/text";

/** Where the landing's closing ticket sends you: My trips with the new-trip sheet open, through sign-up if needed. */
export function startTripHref(signedIn: boolean, typed: string): string {
  const trips = `/trips?new=${encodeURIComponent(typed.trim())}`;
  return signedIn ? trips : `/signup?redirect=${encodeURIComponent(trips)}`;
}

/** `?new=` on My trips: null means no sheet; a string (maybe empty) opens it with that name. */
export function newTripName(raw: string | string[] | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === undefined) return null;
  return value.trim().slice(0, TEXT_CAPS.tripName);
}
