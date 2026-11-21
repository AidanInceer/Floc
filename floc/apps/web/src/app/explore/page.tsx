import { EMPTY_FINDER } from "@floc/core/trip/explore/finder/finder";
import { openingPick, openingPool } from "@floc/core/trip/explore/finder/opening-pick";
import { comingSeason } from "@floc/core/trip/explore/finder/season-picks";
import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import { countryName, readCountryCode } from "@floc/core/people/countries";
import { headers } from "next/headers";

import { ExploreFront } from "@/components/explore/explore-front";
import { ListingRatesProvider } from "@/components/explore/listing-rates";
import { SavedTripsProvider } from "@/components/explore/save/saved-trips";
import { getSession } from "@/server/access";
import { savedTripIds } from "@/server/explore/explore-saves";
import { loadTaste } from "@/server/explore/explore-finder";
import { listingRates, viewerCurrency } from "@/server/money/viewer-currency";
import { publicMetadata } from "@/lib/seo/public-pages";

export const metadata = publicMetadata({
  path: "/explore",
  title: "Explore",
  description: "Ready-made group trips to borrow: the route, the days and the costs, ready to make your own.",
});

type Props = { searchParams: Promise<{ country?: string | string[] }> };

export default async function ExplorePage({ searchParams }: Props) {
  const code = readCountryCode((await searchParams).country);
  const country = code ? countryName(code) : null;
  const session = await getSession();
  const userId = session?.user?.id ?? null;
  const asked = await headers();
  const [taste, rates, saved] = await Promise.all([
    userId ? loadTaste(userId) : null,
    viewerCurrency(userId, asked).then(listingRates),
    userId ? savedTripIds(userId) : [],
  ]);
  const initialFinder = country ? { ...EMPTY_FINDER, q: country } : (taste?.finder ?? EMPTY_FINDER);
  const season = comingSeason(new Date().getUTCMonth() + 1);
  const opening = openingPick(openingPool(PRESET_TRIPS, season, { saved, likes: taste?.likes ?? null }), crypto.getRandomValues(new Uint32Array(1))[0]! / 2 ** 32).id;

  return (
    <div className="pb-20">
      <ListingRatesProvider rates={rates}>
        <SavedTripsProvider ids={saved} signedIn={!!userId}>
          <ExploreFront signedIn={!!userId} initialFinder={initialFinder} season={season} opening={opening} blankName={country} />
        </SavedTripsProvider>
      </ListingRatesProvider>
    </div>
  );
}
