"use client";

import Link from "next/link";
import { filterCheck, type ExploreFilter } from "@floc/core/trip/explore/explore-filter";
import type { ExploreSort } from "@floc/core/trip/explore/explore-sort";
import { PRESET_TRIPS, REGIONS, type PresetTrip, type Region } from "@floc/core/trip/explore/preset-trips";
import { useState } from "react";

import { ExplorePass, missChip } from "@/components/explore/all/explore-pass";
import { ExploreTile, tagClass } from "@/components/explore/all/explore-tile";
import { exploreHref } from "@/components/explore/explore-href";
import { ExploreSortHead } from "@/components/explore/explore-sort-head";
import { Dialog } from "@/components/system/dialog";
import { CrossIcon } from "@/components/system/icons";
import { ButtonLink, cx } from "@/components/system/ui";

// Eight listings and the "Your own" tile fill three rows of three.
const TILE_LIMIT = 8;
// Below this the pass has no column of its own, so it opens as a sheet. The same width as `lg:` below.
const BESIDE = "(min-width: 1024px)";

const tab = (on: boolean) =>
  cx(
    "inline-flex items-baseline gap-1.5 rounded-full px-3 py-1.5 text-[13px] transition-colors",
    on ? "bg-ink text-paper" : "text-ink-soft hover:text-ink",
  );

const countOf = (region: Region | null) => (region ? PRESET_TRIPS.filter((t) => t.region === region).length : PRESET_TRIPS.length);

export type ExploreView = { region: Region | null; sort: ExploreSort; showAll: boolean };

function OwnTile({ empty, region, signedIn }: { empty: boolean; region: Region | null; signedIn: boolean }) {
  return (
    <li className="flex min-h-40 flex-col items-start justify-center gap-1.5 rounded-[18px] border-[1.5px] border-dashed border-rule-strong p-4">
      <span className={cx(tagClass, "border border-dashed border-rule-strong text-ink-soft")}>Anywhere</span>
      <strong className="font-display text-base font-semibold tracking-[-0.02em]">{empty ? `Nothing else in ${region ?? "the list"}` : "Your own"}</strong>
      <p className="text-[13px] text-ink-soft">No dates, no destination. See who agrees.</p>
      <ButtonLink href={signedIn ? "/trips" : "/signup"} className="mt-2">
        Start blank
      </ButtonLink>
    </li>
  );
}

/** Every listing as an outline tile, with the picked one open as a pass: beside the tiles on a wide screen, in a sheet on a narrow one. */
export function ExploreAll({
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
  const [picked, setPicked] = useState<string | null>(null);
  const [inSheet, setInSheet] = useState(false);
  const shown = showAll ? trips : trips.slice(0, TILE_LIMIT);
  const hidden = trips.length - shown.length;
  const open = shown.find((t) => t.id === picked) ?? shown[0];

  const pick = (id: string) => {
    setPicked(id);
    if (!matchMedia(BESIDE).matches) setInSheet(true);
  };

  return (
    <section className="mt-16">
      <div className="mb-5 flex flex-col gap-3 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-6">
        <h2 className="text-[clamp(1.6rem,3vw,2.3rem)] tracking-[-0.03em]">All trips</h2>
        <nav aria-label="Filter by region" className="flex flex-wrap gap-1 md:justify-center">
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
        <ExploreSortHead sort={sort} region={region} showAll={showAll} />
      </div>

      <div className="grid items-start gap-9 lg:grid-cols-[minmax(0,1fr)_27rem]">
        <div>
          <ul className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
            {shown.map((trip) => (
              <li key={trip.id}>
                <ExploreTile trip={trip} onPick={pick} current={trip.id === open?.id}>
                  <span className="mt-1 flex flex-wrap gap-1.5 empty:hidden">
                    {filterCheck(trip, filter).misses.map((miss) => (
                      <span key={miss} className={missChip}>
                        {miss}
                      </span>
                    ))}
                  </span>
                </ExploreTile>
              </li>
            ))}
            <OwnTile empty={trips.length === 0} region={region} signedIn={signedIn} />
          </ul>
          {trips.length > TILE_LIMIT ? (
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
        </div>
        {open ? (
          <aside className="sticky top-[4.5rem] hidden lg:block">
            <ExplorePass trip={open} filter={filter} signedIn={signedIn} />
          </aside>
        ) : null}
      </div>

      {open ? (
        <Dialog
          open={inSheet}
          onClose={() => setInSheet(false)}
          title={open.title}
          className="m-0 mt-auto max-h-[90dvh] w-full max-w-none overflow-y-auto rounded-t-[22px] bg-sheet p-0 text-ink backdrop:bg-black/40 sm:mx-auto sm:max-w-lg lg:hidden"
        >
          <div className="sticky top-0 z-10 flex justify-end bg-sheet px-2 py-1.5">
            <button type="button" onClick={() => setInSheet(false)} aria-label="Close" className="grid size-9 place-items-center rounded-full text-ink-soft hover:text-ink">
              <CrossIcon />
            </button>
          </div>
          {inSheet ? <ExplorePass trip={open} filter={filter} signedIn={signedIn} inSheet /> : null}
        </Dialog>
      ) : null}
    </section>
  );
}
