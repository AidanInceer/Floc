import { wantToGoCountries } from "@floc/core/itinerary/travel-map";
import { PRESET_TRIPS, type PresetTrip } from "@floc/core/trip/explore/preset-trips";
import { headers } from "next/headers";

import { ListingRatesProvider } from "@/components/explore/listing-rates";
import { SavedTripsProvider } from "@/components/explore/save/saved-trips";
import { ListsPage } from "@/components/lists/lists-page";
import { WantToGo } from "@/components/lists/want-to-go";
import { PageTitle } from "@/components/system/ui";
import { requireUser } from "@/server/access";
import { savedTripIds } from "@/server/explore/explore-saves";
import { travelMapFor } from "@/server/itinerary/travel-map";
import { listingRates, viewerCurrency } from "@/server/money/viewer-currency";

export const metadata = { title: "Saved" };

const byId = new Map(PRESET_TRIPS.map((t) => [t.id, t]));

/** Where you want to go (#467, ADR-042): saved Explore trips and want-to-go countries, in one grid. Only yours. */
export default async function SavedPage() {
  const viewer = await requireUser("/lists");
  const [saved, map, rates] = await Promise.all([
    savedTripIds(viewer.id),
    travelMapFor(viewer.id),
    viewerCurrency(viewer.id, await headers()).then(listingRates),
  ]);
  const trips = saved.map((id) => byId.get(id)).filter((t): t is PresetTrip => Boolean(t));

  return (
    <ListsPage current="saved">
      <PageTitle className="sr-only">Saved</PageTitle>
      <ListingRatesProvider rates={rates}>
        <SavedTripsProvider ids={saved} signedIn>
          <WantToGo trips={trips} countries={wantToGoCountries(map)} />
        </SavedTripsProvider>
      </ListingRatesProvider>
    </ListsPage>
  );
}
