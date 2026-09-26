import Link from "next/link";
import type { ExploreAnswers } from "@floc/core/trip/explore/explore-match";
import { EXPLORE_SORTS, type ExploreSort } from "@floc/core/trip/explore/explore-sort";
import { PRESET_TRIPS, REGIONS, type PresetTrip, type Region } from "@floc/core/trip/explore/preset-trips";

import { exploreHref } from "@/components/explore/explore-href";
import { ExploreRowList } from "@/components/explore/explore-row-list";
import { ButtonLink, cx } from "@/components/system/ui";

const ROW_LIMIT = 10;

const row =
  "grid min-h-[3.4rem] grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-rule px-1 py-2.5 hover:bg-sheet md:gap-4 md:grid-cols-[7.5rem_minmax(0,1fr)_4.5rem_6.5rem_auto]";

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
  answers,
  signedIn,
}: {
  trips: PresetTrip[];
  view: ExploreView;
  answers: ExploreAnswers;
  signedIn: boolean;
}) {
  const { region, sort, showAll } = view;
  const shown = showAll ? trips : trips.slice(0, ROW_LIMIT);
  const hidden = trips.length - shown.length;
  return (
    <section className="mt-16">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <h2 className="text-[clamp(1.6rem,3vw,2.3rem)] tracking-[-0.03em]">Everything else</h2>
          <nav aria-label="Sort trips" className="inline-flex gap-0.5 rounded-xl bg-sheet-2 p-[3px]">
            {(Object.keys(EXPLORE_SORTS) as ExploreSort[]).map((s) => (
              <Link
                key={s}
                href={exploreHref({ region, sort: s, showAll })}
                scroll={false}
                aria-current={s === sort ? "true" : undefined}
                className={cx(
                  "rounded-[9px] px-2.5 py-1 text-xs transition-colors",
                  s === sort ? "bg-sheet font-semibold text-ink shadow-[var(--shadow-sm)]" : "text-ink-soft hover:text-ink",
                )}
              >
                {EXPLORE_SORTS[s]}
              </Link>
            ))}
          </nav>
        </div>
        <nav aria-label="Filter by region" className="flex flex-wrap gap-1">
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

      <div aria-hidden className={`${row} hidden min-h-0 border-b-0 py-1 hover:bg-transparent md:grid`}>
        <span />
        <span />
        <span className="typed text-right text-ink-soft">Nights</span>
        <span className="typed text-right text-ink-soft">From</span>
        <span className="w-[26px]" />
      </div>
      <ul className="border-t border-rule">
        <ExploreRowList trips={shown} answers={answers} signedIn={signedIn} row={row} tag={tag} />
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
