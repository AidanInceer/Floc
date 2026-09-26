"use client";

import { bestFits, goodFitCount } from "@floc/core/trip/explore/explore-fit";
import { DEFAULT_ANSWERS, type ExploreAnswers } from "@floc/core/trip/explore/explore-match";
import { PRESET_TRIPS, type PresetTrip } from "@floc/core/trip/explore/preset-trips";
import { useRef, useState } from "react";

import { rememberAnswers } from "@/app/explore/actions";
import { ExploreAtlas } from "@/components/explore/explore-atlas";
import { ExploreBest } from "@/components/explore/explore-best";
import { ExploreGroupBar } from "@/components/explore/explore-group-bar";
import { ExplorePostcard } from "@/components/explore/explore-postcard";
import { ExploreRows, type ExploreView } from "@/components/explore/explore-rows";

const BEST_COUNT = 3;

const sameAnswers = (a: ExploreAnswers, b: ExploreAnswers) =>
  a.size === b.size && a.when === b.when && a.cost === b.cost && a.pace === b.pace && a.nights === b.nights;

/** Explore, top to bottom: the map and its postcard, the group's answers, the best three, then the rest. */
export function ExploreFront({
  trips,
  view,
  signedIn,
  initialAnswers,
}: {
  trips: PresetTrip[];
  view: ExploreView;
  signedIn: boolean;
  initialAnswers: ExploreAnswers;
}) {
  const [picked, setPicked] = useState(PRESET_TRIPS[0].id);
  const [answers, setAnswers] = useState(initialAnswers);
  const band = useRef<HTMLElement>(null);
  const pendingSave = useRef<ReturnType<typeof setTimeout>>(undefined);
  const trip = PRESET_TRIPS.find((t) => t.id === picked) ?? PRESET_TRIPS[0];
  const best = bestFits(PRESET_TRIPS, answers, BEST_COUNT);
  const bestIds = new Set(best.map((t) => t.id));

  const answer = (next: ExploreAnswers) => {
    setAnswers(next);
    if (!signedIn) return;
    // Why: a dragged slider fires on every step; save the last one only.
    clearTimeout(pendingSave.current);
    pendingSave.current = setTimeout(() => void rememberAnswers(next), 400);
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

      <ExploreGroupBar
        answers={answers}
        goodFits={goodFitCount(PRESET_TRIPS, answers)}
        changed={!sameAnswers(answers, DEFAULT_ANSWERS)}
        onAnswer={answer}
        onReset={() => answer(DEFAULT_ANSWERS)}
      />

      <div className="mx-auto w-full max-w-[76rem] px-4 sm:px-6">
        <ExploreBest trips={best} answers={answers} onPick={pickFromList} />
        <ExploreRows trips={trips.filter((t) => !bestIds.has(t.id))} view={view} answers={answers} signedIn={signedIn} />
      </div>
    </>
  );
}
