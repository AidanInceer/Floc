import "server-only";

import type { FlocPort } from "@floc/api/port";
import { listingFits } from "@floc/core/trip/explore/fit/listing-fit";
import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";

import { refresh } from "@/server/freshness";
import { loadTaste, saveFinder } from "@/server/explore/explore-finder";
import { savedTripIds, setTripSaved } from "@/server/explore/explore-saves";
import { friendsWhoSaved } from "@/server/explore/friend-saves";
import { listingRates, viewerCurrency } from "@/server/money/viewer-currency";

type ExplorePort = Pick<FlocPort, "loadExplore" | "setExploreFinder" | "listSavedTrips" | "setTripSaved" | "friendsWhoSaved">;

export const explorePort: ExplorePort = {
  async loadExplore(viewerId) {
    const rates = await listingRates(await viewerCurrency(viewerId, new Headers()));
    const { finder, likes, travel } = await loadTaste(viewerId);
    return { finder, likes, rates, fit: listingFits(travel, PRESET_TRIPS, rates) };
  },

  async setExploreFinder(viewerId, finder) {
    await saveFinder(viewerId, finder);
    refresh({ kind: "explore" });
  },

  listSavedTrips: (viewerId) => savedTripIds(viewerId),

  async setTripSaved(viewerId, presetId, saved) {
    await setTripSaved(viewerId, presetId, saved);
    refresh({ kind: "savedTrips" });
  },

  friendsWhoSaved: (viewerId) => friendsWhoSaved(viewerId),
};
