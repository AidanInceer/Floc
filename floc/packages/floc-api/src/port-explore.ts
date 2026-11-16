import type { Finder } from "@floc/core/trip/explore/finder/finder";
import type { ListingRates } from "@floc/core/trip/explore/listing-price";
import type { FriendSaves } from "@floc/core/people/shared-saves";

export type { Finder, FriendSaves };

export type ExploreState = { finder: Finder | null; rates: ListingRates | null };

export type ExplorePort = {
  loadExplore(viewerId: string): Promise<ExploreState>;
  setExploreFinder(viewerId: string, finder: Finder): Promise<void>;
  listSavedTrips(viewerId: string): Promise<string[]>;
  setTripSaved(viewerId: string, presetId: string, saved: boolean): Promise<void>;
  friendsWhoSaved(viewerId: string): Promise<FriendSaves>;
};
