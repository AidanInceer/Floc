"use client";

import { finderCounts, type Finder } from "@floc/core/trip/explore/finder/finder";
import { firstSort, rankTrips, type FinderSort } from "@floc/core/trip/explore/finder/finder-rank";
import { finderPills } from "@floc/core/trip/explore/finder/finder-words";
import { seasonPicks } from "@floc/core/trip/explore/finder/season-picks";
import type { Fits } from "@floc/core/trip/explore/fit/listing-fit";
import { NO_MATCH_LINE } from "@floc/core/trip/explore/fit/match-words";
import { EMPTY_FINDER } from "@floc/core/trip/explore/finder/finder";
import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import { rememberFinder } from "@/app/explore/actions";
import { FinderBar, SortPicker } from "@/components/explore/finder/finder-bar";
import { FinderRail } from "@/components/explore/finder/finder-rail";
import { FinderResults } from "@/components/explore/finder/finder-results";
import { Dialog } from "@/components/system/dialog";
import { LineIcon } from "@/components/system/icons";
import { Button } from "@/components/system/ui";
import { useListingRates } from "@/components/explore/listing-rates";
import { useSavedTrips } from "@/components/explore/save/saved-trips";
import { nounFor } from "@floc/core/text/count-word";

const sheetClass =
  "m-0 mt-auto max-h-[90dvh] w-full max-w-none overflow-y-auto rounded-t-md bg-sheet p-0 text-ink backdrop:bg-black/40 sm:mx-auto sm:max-w-lg lg:hidden";

export function ExploreFinder({
  signedIn,
  initialFinder,
  blankName,
  season,
  fit,
}: {
  signedIn: boolean;
  initialFinder: Finder;
  blankName: string | null;
  season: number[];
  fit: Fits | null;
}) {
  const [finder, setFinder] = useState(initialFinder);
  const rates = useListingRates();
  const saved = useSavedTrips().ids;
  const [sort, setSort] = useState<FinderSort>(firstSort(fit !== null));
  const [sheet, setSheet] = useState(false);
  const pendingSave = useRef<ReturnType<typeof setTimeout>>(undefined);

  const picks = useMemo(() => seasonPicks(PRESET_TRIPS, season).map((t) => t.id), [season]);
  const rows = useMemo(() => rankTrips(PRESET_TRIPS, finder, sort, saved, picks, fit), [finder, sort, saved, picks, fit]);
  const counts = useMemo(() => finderCounts(PRESET_TRIPS, finder), [finder]);

  const change = (next: Finder) => {
    setFinder(next);
    if (!signedIn) return;
    clearTimeout(pendingSave.current);
    pendingSave.current = setTimeout(() => void rememberFinder(next), 400);
  };

  const pills = finderPills(finder, rates).map((p) => ({ id: p.id, label: p.label, onClear: () => change(p.clear) }));
  const rail = { finder, counts, shown: rows.length, onChange: change, onClear: () => change(EMPTY_FINDER) };
  const hint = fit ? null : (
    <Link href={signedIn ? "/profile?section=about-you#settings-about-you" : "/signup"} className="text-[13px] text-ink-soft transition-colors hover:text-pen">
      {NO_MATCH_LINE}
    </Link>
  );

  return (
    <section className="mx-auto mt-14 w-full max-w-[76rem] px-4 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-[clamp(1.6rem,3vw,2.3rem)] tracking-[-0.03em]">All trips</h2>
        <div className="flex w-full flex-wrap items-center gap-2 sm:max-w-[34rem] sm:flex-nowrap">
          <label className="flex h-11 w-full min-w-52 flex-1 items-center gap-2.5 rounded-sm border border-rule-strong bg-sheet px-4">
            <LineIcon className="text-ink-faint">
              <circle cx="6.2" cy="6.2" r="3.8" />
              <path d="m9 9 3 3" />
            </LineIcon>
            <input
              type="search"
              value={finder.q}
              onChange={(e) => change({ ...finder, q: e.target.value })}
              aria-label="Search trips"
              className="w-full bg-transparent text-sm outline-none placeholder:text-ink-faint"
            />
          </label>
          <SortPicker sort={sort} matched={fit !== null} onSort={setSort} />
        </div>
      </div>
      <div className="grid items-start gap-7 lg:grid-cols-[17.5rem_minmax(0,1fr)]">
        <aside aria-label="Filters" className="hidden lg:block">
          <FinderRail {...rail} />
        </aside>
        <div>
          <FinderBar shown={rows.length} set={pills.length + finder.likes.length} pills={pills} hint={hint} onOpen={() => setSheet(true)} />
          <FinderResults rows={rows} likes={finder.likes} split={sort === "match" && finder.likes.length > 0} signedIn={signedIn} blankName={blankName} />
        </div>
      </div>

      <Dialog open={sheet} onClose={() => setSheet(false)} title="Filters" className={sheetClass}>
        <div className="px-5 pt-3">
          <FinderRail {...rail} onClose={() => setSheet(false)} />
        </div>
        <div className="sticky bottom-0 border-t border-rule bg-sheet px-5 py-3">
          <Button type="button" variant="primary" className="w-full" onClick={() => setSheet(false)}>
            Show {rows.length} {nounFor(rows.length, "trip")}
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
