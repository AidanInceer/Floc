"use client";

import type { Finder } from "@floc/core/trip/explore/finder/finder";
import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import { useRef, useState } from "react";

import { ExploreGlobe, type AtlasRoute } from "@/components/explore/globe/explore-globe";
import { ExplorePostcard } from "@/components/explore/explore-postcard";
import { ExploreFinder } from "@/components/explore/finder/explore-finder";

/** Explore, top to bottom: the map and its postcard, then every trip with the finder beside it. */
export function ExploreFront({ signedIn, initialFinder }: { signedIn: boolean; initialFinder: Finder }) {
  const [picked, setPicked] = useState(PRESET_TRIPS[0].id);
  const [route, setRoute] = useState<AtlasRoute | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const trip = PRESET_TRIPS.find((t) => t.id === picked) ?? PRESET_TRIPS[0];

  const pickOnMap = (id: string) => {
    setPicked(id);
    setRoute((r) => ({ id, n: (r?.n ?? 0) + 1 }));
  };

  return (
    <>
      <h1 className="sr-only">Explore</h1>
      {/* The globe runs up behind the top bar's beads; -mt-15 is the bar's height. */}
      <section className="relative -mt-15">
        <div className="h-[25.75rem] lg:absolute lg:inset-0 lg:h-auto">
          <ExploreGlobe picked={trip.id} route={route} card={card} onPick={pickOnMap} onWorld={() => setRoute(null)} />
        </div>
        <div className="pointer-events-none relative mx-auto flex max-w-[90rem] justify-end px-4 pb-6 pt-21 sm:px-6 lg:min-h-[700px] lg:pb-8 lg:pt-23">
          <div ref={card} className="pointer-events-auto w-full lg:w-[25rem]">
            <ExplorePostcard trip={trip} signedIn={signedIn} />
          </div>
        </div>
      </section>

      <ExploreFinder signedIn={signedIn} initialFinder={initialFinder} />
    </>
  );
}
