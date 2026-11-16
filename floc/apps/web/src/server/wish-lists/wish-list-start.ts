import "server-only";

import { wantToGoCountries } from "@floc/core/itinerary/travel-map";
import type { WishItemInput } from "@floc/core/lists/wish-list";
import { friendSavedPart } from "@floc/core/people/shared-saves";

import { requireProfileView } from "@/server/auth/visibility";
import { savedTripIds } from "@/server/explore/explore-saves";
import { travelMapFor } from "@/server/itinerary/travel-map";

import { createWishList } from "./wish-list-writes";

async function bothSaved(viewerId: string, friendId: string): Promise<WishItemInput[]> {
  const [profile, yourTrips, yourMap] = await Promise.all([
    requireProfileView(friendId, viewerId),
    savedTripIds(viewerId),
    travelMapFor(viewerId),
  ]);
  const part = friendSavedPart(profile.saved, profile.travelMap);
  if (!part) return [];
  const trips = new Set(yourTrips);
  const countries = new Set(wantToGoCountries(yourMap).map((c) => c.code));
  return [
    ...part.trips.filter((t) => trips.has(t.id)).map((t): WishItemInput => ({ kind: "explore", presetId: t.id })),
    ...part.countries.filter((c) => countries.has(c.code)).map((c): WishItemInput => ({ kind: "country", code: c.code })),
  ];
}

export async function startWishListWith(viewerId: string, friendId: string): Promise<number> {
  const items = await bothSaved(viewerId, friendId);
  return createWishList(viewerId, { inviteIds: [friendId], items });
}
