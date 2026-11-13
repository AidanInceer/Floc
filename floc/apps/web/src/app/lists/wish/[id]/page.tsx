import { PRESET_TRIPS, type PresetTrip } from "@floc/core/trip/explore/preset-trips";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { ListingRatesProvider } from "@/components/explore/listing-rates";
import { SavedTripsProvider } from "@/components/explore/save/saved-trips";
import { ListsPage } from "@/components/lists/lists-page";
import { WishAddBox, type ListingChoice } from "@/components/lists/wish/wish-add-box";
import { WishItems } from "@/components/lists/wish/wish-items";
import { WishListHead } from "@/components/lists/wish/wish-list-head";
import { requireUser } from "@/server/access";
import { savedTripIds } from "@/server/explore/explore-saves";
import { listingRates, viewerCurrency } from "@/server/money/viewer-currency";
import { peopleSourcesFor } from "@/server/wish-lists/people-sources";
import { wishListFor } from "@/server/wish-lists/wish-lists";

export const metadata = { title: "Wish list" };

const LISTING_CHOICES: ListingChoice[] = PRESET_TRIPS.map((t) => ({ id: t.id, title: t.title, country: t.country }));
const byId = new Map(PRESET_TRIPS.map((t) => [t.id, t]));

/** One wish list (#623, ADR-049). A non-member and a list that never existed get the same 404. */
export default async function WishListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listId = Number(id);
  const viewer = await requireUser(`/lists/wish/${id}`);
  const [list, sources, saved, rates] = await Promise.all([
    wishListFor(viewer.id, listId),
    peopleSourcesFor(viewer.id),
    savedTripIds(viewer.id),
    viewerCurrency(viewer.id, await headers()).then(listingRates),
  ]);
  if (!list) notFound();

  const listings: Record<string, PresetTrip> = {};
  for (const item of list.items) {
    const trip = item.presetId ? byId.get(item.presetId) : undefined;
    if (trip) listings[trip.id] = trip;
  }

  return (
    <ListsPage current="wish" wide>
      <WishListHead list={list} sources={sources} />
      <WishAddBox listId={list.id} listings={LISTING_CHOICES} />
      <ListingRatesProvider rates={rates}>
        <SavedTripsProvider ids={saved} signedIn>
          <WishItems listId={list.id} items={list.items} listings={listings} />
        </SavedTripsProvider>
      </ListingRatesProvider>
    </ListsPage>
  );
}
