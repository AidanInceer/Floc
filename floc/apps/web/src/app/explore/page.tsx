/**
 * /explore — ready-made trip ideas to start from. Listings are static and
 * editorial: nothing bookable (see docs/partner-trips.html). Public, because
 * the reason to make an account is on this page; starting a trip needs one.
 */
import { EMPTY_FINDER } from "@floc/core/trip/explore/finder/finder";

import { ExploreFront } from "@/components/explore/explore-front";
import { getSession } from "@/server/access";
import { loadFinder } from "@/server/explore/explore-finder";

export const metadata = { title: "Explore" };

export default async function ExplorePage() {
  const session = await getSession();
  const userId = session?.user?.id ?? null;
  const finder = userId ? await loadFinder(userId) : null;

  return (
    <div className="pb-20">
      <ExploreFront signedIn={!!userId} initialFinder={finder ?? EMPTY_FINDER} />
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
