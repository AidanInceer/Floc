import { TEXT_CAPS } from "@floc/core/text/text";

/** Where the landing's closing ticket sends you: My trips with the new-trip sheet open, through sign-up if needed. */
export function startTripHref(signedIn: boolean, typed: string): string {
  const trips = `/trips?new=${encodeURIComponent(typed.trim())}`;
  return signedIn ? trips : `/signup?redirect=${encodeURIComponent(trips)}`;
}

/** Where the landing's "Start from Japan" sends you: that listing on Explore with the copy sheet open (ADR-025). */
export function listingStartHref(signedIn: boolean, listingId: string): string {
  const listing = `/explore/${encodeURIComponent(listingId)}?start=1`;
  return signedIn ? listing : `/signup?redirect=${encodeURIComponent(listing)}`;
}

/** Something on your Saved list: an Explore trip, or a country you want to go to (#467). */
export type SavedThing = { kind: "trip"; id: string } | { kind: "country"; name: string };

/** "Start trip" on Saved: a trip brings its plan through the copy choice (ADR-025); a country is just a trip named after it. */
export function savedStartHref(saved: SavedThing): string {
  return saved.kind === "trip" ? listingStartHref(true, saved.id) : startTripHref(true, saved.name);
}

/** `?new=` on My trips: null means no sheet; a string (maybe empty) opens it with that name. */
export function newTripName(raw: string | string[] | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === undefined) return null;
  return value.trim().slice(0, TEXT_CAPS.tripName);
}

/** A wish list item to start a trip from (#623): a listing, or a name for a new trip. */
export type WishThing = { kind: "explore"; presetId: string } | { kind: "country"; name: string } | { kind: "text"; text: string };

/** Start trip on a wish list item: the same path as Saved, with the list's people asked along (`wish`). */
export function wishStartHref(thing: WishThing, listId: number): string {
  if (thing.kind === "explore") return `${listingStartHref(true, thing.presetId)}&wish=${listId}`;
  const name = (thing.kind === "country" ? thing.name : thing.text).trim().slice(0, TEXT_CAPS.tripName);
  return `/trips?new=${encodeURIComponent(name)}&wish=${listId}`;
}

/** `?wish=` on My trips and a listing: the list whose people come ticked, or null. */
export function wishListParam(raw: string | string[] | undefined): number | null {
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}
