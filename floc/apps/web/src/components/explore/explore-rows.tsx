import Link from "next/link";
import { EXPLORE_SORTS, type ExploreSort } from "@floc/core/trip/explore/explore-sort";
import { REGIONS, type PresetTrip, type Region } from "@floc/core/trip/explore/preset-trips";

import { exploreHref } from "@/components/explore/explore-href";
import { ExploreRowList } from "@/components/explore/explore-row-list";
import { FilterIcon, SortIcon } from "@/components/system/list-control-icons";
import { PillChoice } from "@/components/system/pill-choice";
import { ButtonLink } from "@/components/system/ui";

const ROW_LIMIT = 10;

const row =
  "grid min-h-[3.25rem] grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-rule px-1 py-2.5 hover:bg-sheet md:gap-4 md:grid-cols-[7.5rem_minmax(0,1fr)_4.5rem_6.5rem_auto]";

const tag = "typed w-fit max-w-full truncate rounded-md px-2 py-1";

export function ExploreRows({
  trips,
  region,
  sort,
  signedIn,
  showAll,
}: {
  trips: PresetTrip[];
  region: Region | null;
  sort: ExploreSort;
  signedIn: boolean;
  showAll: boolean;
}) {
  const shown = showAll ? trips : trips.slice(0, ROW_LIMIT);
  const hidden = trips.length - shown.length;
  return (
    <section className="mt-14">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <h2 className="text-[clamp(1.5rem,3vw,2.1rem)]">All trips</h2>
          <PillChoice
          icon={<SortIcon />}
          label="Sort trips"
          current={sort}
          options={(Object.keys(EXPLORE_SORTS) as ExploreSort[]).map((s) => ({
            key: s,
            label: EXPLORE_SORTS[s],
            href: exploreHref({ region, sort: s, showAll }),
          }))}
          />
        </div>
        <PillChoice
          icon={<FilterIcon />}
          label="Filter by region"
          current={region ?? "all"}
          options={[null, ...REGIONS].map((r) => ({
            key: r ?? "all",
            label: r ?? "Everywhere",
            href: exploreHref({ region: r, sort, showAll: false }),
          }))}
        />
      </div>

      <div aria-hidden className={`${row} hidden min-h-0 border-b-0 py-1 hover:bg-transparent md:grid`}>
        <span />
        <span />
        <span className="typed text-right text-ink-soft">Nights</span>
        <span className="typed text-right text-ink-soft">From</span>
        <span className="w-[26px]" />
      </div>
      <ul className="border-t border-rule">
        <ExploreRowList trips={shown} signedIn={signedIn} row={row} tag={tag} />
        <li className="mt-3 grid min-h-[3.25rem] grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-3 md:grid-cols-[7.5rem_minmax(0,1fr)_auto] md:gap-4 rounded-lg border-[1.5px] border-dashed border-rule-strong px-1 py-2.5">
          <span className={`${tag} border border-dashed border-rule-strong text-ink-soft`}>Anywhere</span>
          <p className="min-w-0 truncate">
            <strong className="font-semibold">{trips.length === 0 ? `Nothing in ${region} yet` : "Your own"}</strong>
            <span className="ml-2 hidden text-[13px] text-ink-soft md:inline">No dates, no destination. See who agrees.</span>
          </p>
          <ButtonLink href={signedIn ? "/trips" : "/signup"}>Start blank</ButtonLink>
        </li>
      </ul>
      {trips.length > ROW_LIMIT ? (
        <Link
          href={exploreHref({ region, sort, showAll: !showAll })}
          scroll={false}
          className="mx-auto mt-4 flex w-fit flex-col items-center gap-1 text-ink-soft hover:text-ink"
        >
          <span className="typed">{showAll ? "Show fewer" : `Show ${hidden} more`}</span>
          <svg width="18" height="18" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d={showAll ? "m3.5 8.5 3.5-3.5 3.5 3.5" : "m3.5 5.5 3.5 3.5 3.5-3.5"} />
          </svg>
        </Link>
      ) : null}
    </section>
  );
}
