/**
 * /explore — ready-made trip ideas to start from. Listings are static and
 * editorial: nothing bookable (see docs/partner-trips.html). Public, because
 * the reason to make an account is on this page; starting a trip needs one.
 */
import { EMPTY_FINDER } from "@floc/core/trip/explore/finder/finder";
import { countryName, readCountryCode } from "@floc/core/people/countries";
import { headers } from "next/headers";

import { ExploreFront } from "@/components/explore/explore-front";
import { ListingRatesProvider } from "@/components/explore/listing-rates";
import { SavedTripsProvider } from "@/components/explore/save/saved-trips";
import { getSession } from "@/server/access";
import { savedTripIds } from "@/server/explore/explore-saves";
import { loadFinder } from "@/server/explore/explore-finder";
import { listingRates, viewerCurrency } from "@/server/money/viewer-currency";
import { publicMetadata } from "@/lib/seo/public-pages";

export const metadata = publicMetadata({
  path: "/explore",
  title: "Explore",
  description: "Ready-made group trips to borrow: the route, the days and the costs, ready to make your own.",
});

type Props = { searchParams: Promise<{ country?: string | string[] }> };

/** `?country=PT` comes from a want-to-go country on Lists (#467): Explore opens searched for it. */
export default async function ExplorePage({ searchParams }: Props) {
  const code = readCountryCode((await searchParams).country);
  const country = code ? countryName(code) : null;
  const session = await getSession();
  const userId = session?.user?.id ?? null;
  const asked = await headers();
  const [finder, rates, saved] = await Promise.all([
    userId ? loadFinder(userId) : null,
    viewerCurrency(userId, asked).then(listingRates),
    userId ? savedTripIds(userId) : [],
  ]);
  const initialFinder = country ? { ...EMPTY_FINDER, q: country } : (finder ?? EMPTY_FINDER);

  return (
    <div className="pb-20">
      <ListingRatesProvider rates={rates}>
        <SavedTripsProvider ids={saved} signedIn={!!userId}>
          <ExploreFront signedIn={!!userId} initialFinder={initialFinder} blankName={country} />
        </SavedTripsProvider>
      </ListingRatesProvider>
    </div>
  );
}
