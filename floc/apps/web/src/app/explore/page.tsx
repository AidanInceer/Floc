/**
 * /explore — ready-made trip ideas to start from. Listings are static and
 * editorial: nothing bookable (see docs/partner-trips.html). Public, because
 * the reason to make an account is on this page; saving and starting need one.
 */
import { DEFAULT_ANSWERS } from "@floc/core/trip/explore/explore-match";
import { PRESET_TRIPS, REGIONS, type Region } from "@floc/core/trip/explore/preset-trips";

import { ExploreRows } from "@/components/explore/explore-rows";
import { ExploreTop } from "@/components/explore/explore-top";
import { getSession } from "@/server/access";
import { loadAnswers } from "@/server/explore/explore-answers";
import { listSaved } from "@/server/explore/shortlist";

function isRegion(value: string | undefined): value is Region {
  return !!value && (REGIONS as readonly string[]).includes(value);
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; all?: string }>;
}) {
  const session = await getSession();
  const userId = session?.user?.id ?? null;
  const [{ region, all }, saved, answers] = await Promise.all([
    searchParams,
    userId ? listSaved(userId) : [],
    userId ? loadAnswers(userId) : null,
  ]);
  const active = isRegion(region) ? region : null;
  const shown = active ? PRESET_TRIPS.filter((t) => t.region === active) : PRESET_TRIPS;

  return (
    <div className="mx-auto w-full max-w-[76rem] px-4 pb-20 pt-6 sm:px-6">
      <ExploreTop signedIn={!!userId} saved={saved} initialAnswers={answers ?? DEFAULT_ANSWERS} />
      <ExploreRows trips={shown} region={active} signedIn={!!userId} showAll={all === "1"} />

      <p className="mt-10 border-t border-rule pt-5 text-xs text-ink-faint">
        These listings are illustrative and not bookable. Operator names are
        placeholders used to show what a listing would look like — Floc has
        no partnership with any of them, and nothing on this page is paid
        placement.
      </p>
    </div>
  );
}
