"use client";

import { forYou, type ExploreFilter } from "@floc/core/trip/explore/explore-filter";
import { PRESET_TRIPS, type PresetTrip } from "@floc/core/trip/explore/preset-trips";
import { useRef, useState } from "react";

import { rememberFilter } from "@/app/explore/actions";
import { ExploreGlobe, type AtlasRoute } from "@/components/explore/globe/explore-globe";
import { ExploreFilterBar } from "@/components/explore/explore-filter-bar";
import { ExploreForYou } from "@/components/explore/explore-for-you";
import { ExplorePostcard } from "@/components/explore/explore-postcard";
import { ExploreAll, type ExploreView } from "@/components/explore/all/explore-all";

const FOR_YOU_COUNT = 5;

/** Explore, top to bottom: the map and its postcard, the group's sliders, the picks for you, then every trip as a tile with its pass. */
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
  const [route, setRoute] = useState<AtlasRoute | null>(null);
  const [filter, setFilter] = useState(initialFilter);
  const band = useRef<HTMLElement>(null);
  const card = useRef<HTMLDivElement>(null);
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

  const pickOnMap = (id: string) => {
    setPicked(id);
    setRoute((r) => ({ id, n: (r?.n ?? 0) + 1 }));
  };

  const pickFromList = (id: string) => {
    pickOnMap(id);
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    band.current?.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
  };

  return (
    <>
      <h1 className="sr-only">Explore</h1>
      {/* The globe runs up behind the top bar's beads; -mt-15 is the bar's height. */}
      <section ref={band} className="relative -mt-15 scroll-mt-14">
        <div className="h-[25.75rem] lg:absolute lg:inset-0 lg:h-auto">
          <ExploreGlobe picked={trip.id} route={route} card={card} onPick={pickOnMap} onWorld={() => setRoute(null)} />
        </div>
        <div className="pointer-events-none relative mx-auto flex max-w-[90rem] justify-end px-4 pb-6 pt-21 sm:px-6 lg:min-h-[700px] lg:pb-8 lg:pt-23">
          <div ref={card} className="pointer-events-auto w-full lg:w-[25rem]">
            <ExplorePostcard trip={trip} signedIn={signedIn} />
          </div>
        </div>
      </section>

      <ExploreFilterBar filter={filter} onChange={change} />

      <div className="mx-auto w-full max-w-[76rem] px-4 sm:px-6">
        <ExploreForYou trips={picks} filter={filter} onPick={pickFromList} />
        <ExploreAll trips={trips} view={view} filter={filter} signedIn={signedIn} />
      </div>
    </>
  );
}
