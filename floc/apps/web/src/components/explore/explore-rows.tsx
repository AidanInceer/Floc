import Link from "next/link";
import type { ExploreFilter } from "@floc/core/trip/explore/explore-filter";
import type { ExploreSort } from "@floc/core/trip/explore/explore-sort";
import { PRESET_TRIPS, REGIONS, type PresetTrip, type Region } from "@floc/core/trip/explore/preset-trips";

import { exploreHref } from "@/components/explore/explore-href";
import { ExploreRowList } from "@/components/explore/explore-row-list";
import { ExploreSortHead } from "@/components/explore/explore-sort-head";
import { ButtonLink, cx } from "@/components/system/ui";

const ROW_LIMIT = 10;

const cols = "md:grid-cols-[7.5rem_minmax(0,1fr)_4.5rem_6.5rem_auto] md:gap-4";

const row = `grid min-h-[3.4rem] grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-rule px-1 py-2.5 hover:bg-sheet ${cols}`;

const tag = "typed w-fit max-w-full truncate rounded-md px-2 py-1";

const tab = (on: boolean) =>
  cx(
    "inline-flex items-baseline gap-1.5 rounded-full px-3 py-1.5 text-[13px] transition-colors",
    on ? "bg-ink text-paper" : "text-ink-soft hover:text-ink",
  );

const countOf = (region: Region | null) => (region ? PRESET_TRIPS.filter((t) => t.region === region).length : PRESET_TRIPS.length);

export type ExploreView = { region: Region | null; sort: ExploreSort; showAll: boolean };

export function ExploreRows({
  trips,
  view,
  filter,
  signedIn,
}: {
  trips: PresetTrip[];
  view: ExploreView;
  filter: ExploreFilter;
  signedIn: boolean;
}) {
  const { region, sort, showAll } = view;
  const shown = showAll ? trips : trips.slice(0, ROW_LIMIT);
  const hidden = trips.length - shown.length;
  return (
    <section className="mt-16">
      <div className="mb-5 flex flex-col gap-3 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-6">
        <h2 className="text-[clamp(1.6rem,3vw,2.3rem)] tracking-[-0.03em]">All trips</h2>
        <nav aria-label="Filter by region" className="flex flex-wrap justify-center gap-1">
          {[null, ...REGIONS].map((r) => (
            <Link
              key={r ?? "all"}
              href={exploreHref({ region: r, sort, showAll: false })}
              scroll={false}
              aria-current={r === region ? "true" : undefined}
              className={tab(r === region)}
            >
              {r ?? "All"}
              <span className="nums text-[10.5px] opacity-70">{countOf(r)}</span>
            </Link>
          ))}
        </nav>
      </div>

      <ExploreSortHead sort={sort} region={region} showAll={showAll} grid={cols} />
      <ul className="border-t border-rule">
        <ExploreRowList trips={shown} filter={filter} signedIn={signedIn} row={row} tag={tag} />
        <li className="mt-3 grid min-h-[3.25rem] grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border-[1.5px] border-dashed border-rule-strong px-1 py-2.5 md:grid-cols-[7.5rem_minmax(0,1fr)_auto] md:gap-4">
          <span className={`${tag} border border-dashed border-rule-strong text-ink-soft`}>Anywhere</span>
          <p className="min-w-0 truncate">
            <strong className="font-semibold">{trips.length === 0 ? `Nothing else in ${region ?? "the list"}` : "Your own"}</strong>
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
