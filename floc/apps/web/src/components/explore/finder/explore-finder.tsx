"use client";

import { finderCounts, type Finder } from "@floc/core/trip/explore/finder/finder";
import { rankTrips, type FinderSort } from "@floc/core/trip/explore/finder/finder-rank";
import { finderPills } from "@floc/core/trip/explore/finder/finder-words";
import { EMPTY_FINDER } from "@floc/core/trip/explore/finder/finder";
import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import { useMemo, useRef, useState } from "react";

import { rememberFinder } from "@/app/explore/actions";
import { FinderBar } from "@/components/explore/finder/finder-bar";
import { FinderRail } from "@/components/explore/finder/finder-rail";
import { FinderResults } from "@/components/explore/finder/finder-results";
import { TripPassDialog } from "@/components/explore/finder/trip-pass-dialog";
import { Dialog } from "@/components/system/dialog";
import { LineIcon } from "@/components/system/icons";
import { Button } from "@/components/system/ui";

const sheetClass =
  "m-0 mt-auto max-h-[90dvh] w-full max-w-none overflow-y-auto rounded-t-[22px] bg-sheet p-0 text-ink backdrop:bg-black/40 sm:mx-auto sm:max-w-lg lg:hidden";

/**
 * Every trip, with the finder beside it: what must fit filters, what you like ranks and never hides.
 * The finder is remembered for someone signed in; the search box is for this visit only.
 */
export function ExploreFinder({ signedIn, initialFinder }: { signedIn: boolean; initialFinder: Finder }) {
  const [finder, setFinder] = useState(initialFinder);
  const [sort, setSort] = useState<FinderSort>("match");
  const [like, setLike] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const top = useRef<HTMLDivElement>(null);
  const pendingSave = useRef<ReturnType<typeof setTimeout>>(undefined);

  const rows = useMemo(() => rankTrips(PRESET_TRIPS, finder, sort, like), [finder, sort, like]);
  const counts = useMemo(() => finderCounts(PRESET_TRIPS, finder), [finder]);
  const liked = like ? PRESET_TRIPS.find((t) => t.id === like) : undefined;

  const change = (next: Finder) => {
    setFinder(next);
    if (!signedIn) return;
    // Why: a dragged slider fires on every step; save the last one only.
    clearTimeout(pendingSave.current);
    pendingSave.current = setTimeout(() => void rememberFinder(next), 400);
  };

  const moreLike = (id: string) => {
    setLike(id);
    setSort("match");
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    top.current?.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
  };

  const pills = [
    ...(liked ? [{ id: "like", label: `Like ${liked.title}`, dark: true, onClear: () => setLike(null) }] : []),
    ...finderPills(finder).map((p) => ({ id: p.id, label: p.label, onClear: () => change(p.clear) })),
  ];
  const rail = { finder, counts, shown: rows.length, onChange: change, onClear: () => { change(EMPTY_FINDER); setLike(null); } };

  return (
    <section className="mx-auto mt-14 w-full max-w-[76rem] px-4 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-[clamp(1.6rem,3vw,2.3rem)] tracking-[-0.03em]">All trips</h2>
        <label className="flex min-h-11 w-full items-center gap-2.5 rounded-full border border-rule-strong bg-sheet px-4 sm:max-w-[26rem]">
          <LineIcon className="text-ink-faint">
            <circle cx="6.2" cy="6.2" r="3.8" />
            <path d="m9 9 3 3" />
          </LineIcon>
          <input
            type="search"
            value={finder.q}
            onChange={(e) => change({ ...finder, q: e.target.value })}
            placeholder="Search a place, country or tag"
            aria-label="Search trips"
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink-faint"
          />
        </label>
      </div>
      <div className="grid items-start gap-7 lg:grid-cols-[17.5rem_minmax(0,1fr)]">
        <aside aria-label="Filters" className="hidden lg:block">
          <FinderRail {...rail} />
        </aside>
        <div ref={top} className="scroll-mt-20">
          <FinderBar
            shown={rows.length}
            set={finderPills(finder).length + finder.likes.length}
            pills={pills}
            sort={sort}
            onSort={setSort}
            onOpen={() => setSheet(true)}
          />
          <FinderResults rows={rows} likes={finder.likes} split={sort === "match" && !like && finder.likes.length > 0} signedIn={signedIn} onPick={setOpen} onLike={moreLike} />
        </div>
      </div>

      <Dialog open={sheet} onClose={() => setSheet(false)} title="Filters" className={sheetClass}>
        <div className="px-5 pt-3">
          <FinderRail {...rail} onClose={() => setSheet(false)} />
        </div>
        <div className="sticky bottom-0 border-t border-rule bg-sheet px-5 py-3">
          <Button type="button" variant="primary" className="w-full" onClick={() => setSheet(false)}>
            Show {rows.length} {rows.length === 1 ? "trip" : "trips"}
          </Button>
        </div>
      </Dialog>
      <TripPassDialog id={open} likes={finder.likes} signedIn={signedIn} onClose={() => setOpen(null)} />
    </section>
  );
}
