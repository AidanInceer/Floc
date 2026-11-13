import { wantToGoCountries } from "@floc/core/itinerary/travel-map";
import { savedSeenBy } from "@floc/core/people/shared-saves";
import { PRESET_TRIPS, type PresetTrip } from "@floc/core/trip/explore/preset-trips";
import { headers } from "next/headers";
import Link from "next/link";

import { ListingRatesProvider } from "@/components/explore/listing-rates";
import { SavedTripsProvider } from "@/components/explore/save/saved-trips";
import { ListsPage } from "@/components/lists/lists-page";
import { WantToGo } from "@/components/lists/want-to-go";
import { PageTitle } from "@/components/system/ui";
import { requireUser } from "@/server/access";
import { getProfile } from "@/server/auth/profile";
import { savedTripIds } from "@/server/explore/explore-saves";
import { friendsWhoSaved } from "@/server/explore/friend-saves";
import { travelMapFor } from "@/server/itinerary/travel-map";
import { listingRates, viewerCurrency } from "@/server/money/viewer-currency";

export const metadata = { title: "Saved" };

const byId = new Map(PRESET_TRIPS.map((t) => [t.id, t]));

/**
 * Where you want to go (#467, ADR-042): saved Explore trips and want-to-go countries, in one grid.
 * Who else sees it is your Saved setting (ADR-045); a tile shows the friends who saved it too (#544).
 */
export default async function SavedPage() {
  const viewer = await requireUser("/lists");
  const [saved, map, rates, friends, profile] = await Promise.all([
    savedTripIds(viewer.id),
    travelMapFor(viewer.id),
    viewerCurrency(viewer.id, await headers()).then(listingRates),
    friendsWhoSaved(viewer.id),
    getProfile(viewer.id),
  ]);
  const trips = saved.map((id) => byId.get(id)).filter((t): t is PresetTrip => Boolean(t));
  const seenBy = savedSeenBy(profile?.visibilitySaved ?? "private", profile?.isPrivate ?? false);

  return (
    <ListsPage current="saved" userId={viewer.id}>
      <PageTitle className="sr-only">Saved</PageTitle>
      {seenBy ? (
        <p className="mb-4">
          <Link href="/settings?section=privacy" className="text-sm text-ink-soft transition-colors hover:text-pen">
            {seenBy}
          </Link>
        </p>
      ) : null}
      <ListingRatesProvider rates={rates}>
        <SavedTripsProvider ids={saved} signedIn>
          <WantToGo trips={trips} countries={wantToGoCountries(map)} friends={friends} />
        </SavedTripsProvider>
      </ListingRatesProvider>
    </ListsPage>
  );
}
