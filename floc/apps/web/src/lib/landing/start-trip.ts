import { TEXT_CAPS } from "@floc/core/text/text";

export function startTripHref(signedIn: boolean, typed: string): string {
  const trips = `/trips?new=${encodeURIComponent(typed.trim())}`;
  return signedIn ? trips : `/signup?redirect=${encodeURIComponent(trips)}`;
}

export function listingStartHref(signedIn: boolean, listingId: string): string {
  const listing = `/explore/${encodeURIComponent(listingId)}?start=1`;
  return signedIn ? listing : `/signup?redirect=${encodeURIComponent(listing)}`;
}

export type SavedThing = { kind: "trip"; id: string } | { kind: "country"; name: string };

export function savedStartHref(saved: SavedThing): string {
  return saved.kind === "trip" ? listingStartHref(true, saved.id) : startTripHref(true, saved.name);
}

export function newTripName(raw: string | string[] | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === undefined) return null;
  return value.trim().slice(0, TEXT_CAPS.tripName);
}

export type WishThing = { kind: "explore"; presetId: string } | { kind: "country"; name: string } | { kind: "text"; text: string };

export function wishStartHref(thing: WishThing, listId: number): string {
  if (thing.kind === "explore") return `${listingStartHref(true, thing.presetId)}&wish=${listId}`;
  const name = (thing.kind === "country" ? thing.name : thing.text).trim().slice(0, TEXT_CAPS.tripName);
  return `/trips?new=${encodeURIComponent(name)}&wish=${listId}`;
}

export function wishListParam(raw: string | string[] | undefined): number | null {
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}
