/** The Explore half of the port. The listings themselves are static `@floc/core` data both clients read directly. */
import type { Finder } from "@floc/core/trip/explore/finder/finder";
import type { ListingRates } from "@floc/core/trip/explore/listing-price";

export type { Finder };

/** `rates` turn listing prices into the viewer's currency; null leaves each in its own (rule 11). */
export type ExploreState = { finder: Finder | null; rates: ListingRates | null };

export type ExplorePort = {
  /** Your last Explore finder — null means never set. */
  loadExplore(viewerId: string): Promise<ExploreState>;
  setExploreFinder(viewerId: string, finder: Finder): Promise<void>;
  /** Listing ids you saved, newest first (#467). Never another account's. */
  listSavedTrips(viewerId: string): Promise<string[]>;
  /** Saves or takes off one listing; an id Explore does not list is ignored. */
  setTripSaved(viewerId: string, presetId: string, saved: boolean): Promise<void>;
};
