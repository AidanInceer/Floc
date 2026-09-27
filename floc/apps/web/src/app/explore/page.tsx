/**
 * /explore — ready-made trip ideas to start from. Listings are static and
 * editorial: nothing bookable (see docs/partner-trips.html). Public, because
 * the reason to make an account is on this page; starting a trip needs one.
 */
import { DEFAULT_FILTER } from "@floc/core/trip/explore/explore-filter";
import { readExploreSort, sortDirection, sortPresetTrips } from "@floc/core/trip/explore/explore-sort";
import { PRESET_TRIPS, REGIONS, type Region } from "@floc/core/trip/explore/preset-trips";

import { ExploreFront } from "@/components/explore/explore-front";
import { getSession } from "@/server/access";
import { loadFilter } from "@/server/explore/explore-filter";
import { loadExploreRates } from "@/server/explore/explore-rates";

function isRegion(value: string | undefined): value is Region {
  return !!value && (REGIONS as readonly string[]).includes(value);
}

export const metadata = { title: "Explore" };

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; all?: string; sort?: string }>;
}) {
  const session = await getSession();
  const userId = session?.user?.id ?? null;
  const params = await searchParams;
  const sort = readExploreSort(params.sort);
  const [filter, rates] = await Promise.all([
    userId ? loadFilter(userId) : null,
    sortDirection(sort, "price") ? loadExploreRates(userId) : null,
  ]);
  const active = isRegion(params.region) ? params.region : null;
  const inRegion = active ? PRESET_TRIPS.filter((t) => t.region === active) : PRESET_TRIPS;
  const shown = sortPresetTrips(inRegion, sort, rates);

  return (
    <div className="pb-20">
      <ExploreFront
        trips={shown}
        view={{ region: active, sort, showAll: params.all === "1" }}
        signedIn={!!userId}
        initialFilter={filter ?? DEFAULT_FILTER}
      />
      <div className="mx-auto max-w-[76rem] px-4 sm:px-6">
        <p className="mt-10 border-t border-rule pt-5 text-xs text-ink-faint">
          These listings are illustrative and not bookable. Operator names are
          placeholders used to show what a listing would look like — Floc has
          no partnership with any of them, and nothing on this page is paid
          placement.
        </p>
      </div>
    </div>
  );
}
