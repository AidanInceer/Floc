"use client";

import { forYou, type ExploreFilter } from "@floc/core/trip/explore/explore-filter";
import { PRESET_TRIPS, type PresetTrip } from "@floc/core/trip/explore/preset-trips";
import { useRef, useState } from "react";

import { rememberFilter } from "@/app/explore/actions";
import { ExploreAtlas } from "@/components/explore/explore-atlas";
import { ExploreFilterBar } from "@/components/explore/explore-filter-bar";
import { ExploreForYou } from "@/components/explore/explore-for-you";
import { ExplorePostcard } from "@/components/explore/explore-postcard";
import { ExploreRows, type ExploreView } from "@/components/explore/explore-rows";

const FOR_YOU_COUNT = 5;

/** Explore, top to bottom: the map and its postcard, the group's sliders, the picks for you, then every trip. */
export function ExploreFront({
  trips,
  view,
  signedIn,
  initialFilter,
}: {
  trips: PresetTrip[];
  view: ExploreView;
  signedIn: boolean;
  initialFilter: ExploreFilter;
}) {
  const [picked, setPicked] = useState(PRESET_TRIPS[0].id);
  const [filter, setFilter] = useState(initialFilter);
  const band = useRef<HTMLElement>(null);
  const pendingSave = useRef<ReturnType<typeof setTimeout>>(undefined);
  const trip = PRESET_TRIPS.find((t) => t.id === picked) ?? PRESET_TRIPS[0];
  const picks = forYou(PRESET_TRIPS, filter, FOR_YOU_COUNT);

  const change = (next: ExploreFilter) => {
    setFilter(next);
    if (!signedIn) return;
    // Why: a dragged slider fires on every step; save the last one only.
    clearTimeout(pendingSave.current);
    pendingSave.current = setTimeout(() => void rememberFilter(next), 400);
  };

  const pickFromList = (id: string) => {
    setPicked(id);
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    band.current?.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
  };

  return (
    <>
      <h1 className="sr-only">Explore</h1>
      {/* The map runs up behind the top bar's beads; -mt-15 is the bar's height. */}
      <section ref={band} className="relative -mt-15 scroll-mt-14 bg-sheet-2">
        <div className="h-[25.75rem] lg:absolute lg:inset-0 lg:h-auto">
          <ExploreAtlas picked={trip.id} onPick={setPicked} />
        </div>
        <div className="pointer-events-none relative mx-auto flex max-w-[90rem] justify-end px-4 pb-6 pt-21 sm:px-6 lg:min-h-[700px] lg:pb-8 lg:pt-23">
          <div className="pointer-events-auto w-full lg:w-[25rem]">
            <ExplorePostcard trip={trip} signedIn={signedIn} />
          </div>
        </div>
      </section>

      <ExploreFilterBar filter={filter} onChange={change} />

      <div className="mx-auto w-full max-w-[76rem] px-4 sm:px-6">
        <ExploreForYou trips={picks} filter={filter} onPick={pickFromList} />
        <ExploreRows trips={trips} view={view} filter={filter} signedIn={signedIn} />
      </div>
    </>
  );
}
