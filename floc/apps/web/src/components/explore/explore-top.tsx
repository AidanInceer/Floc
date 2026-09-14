"use client";

import { rankMatches, type ExploreAnswers } from "@floc/core/trip/explore/explore-match";
import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import { useRef, useState, useTransition } from "react";

import { rememberAnswers, toggleSaved } from "@/app/explore/actions";
import { ExploreAtlas } from "@/components/explore/explore-atlas";
import { ExploreMatches } from "@/components/explore/explore-matches";
import { ExploreQuiz } from "@/components/explore/explore-quiz";
import { ExploreSide } from "@/components/explore/explore-side";
import { ButtonLink, PageTitle } from "@/components/system/ui";

const MATCH_COUNT = 5;

export function ExploreTop({
  signedIn,
  saved,
  initialAnswers,
}: {
  signedIn: boolean;
  saved: string[];
  initialAnswers: ExploreAnswers;
}) {
  const [picked, setPicked] = useState(saved[0] ?? PRESET_TRIPS[0].id);
  const [answers, setAnswers] = useState(initialAnswers);
  const [busy, startSave] = useTransition();
  const atlas = useRef<HTMLDivElement>(null);
  const pendingSave = useRef<ReturnType<typeof setTimeout>>(undefined);
  const trip = PRESET_TRIPS.find((t) => t.id === picked) ?? PRESET_TRIPS[0];

  const answer = (next: ExploreAnswers) => {
    setAnswers(next);
    if (!signedIn) return;
    // Why: a dragged slider fires on every step; save the last one only.
    clearTimeout(pendingSave.current);
    pendingSave.current = setTimeout(() => void rememberAnswers(next), 400);
  };

  const pickFromMatch = (id: string) => {
    setPicked(id);
    atlas.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <PageTitle className="mb-4">Explore</PageTitle>
      <div
        ref={atlas}
        className="grid scroll-mt-20 overflow-hidden rounded-xl border border-rule bg-sheet shadow-[var(--shadow)] lg:grid-cols-[1fr_21rem]"
      >
        <ExploreAtlas picked={trip.id} onPick={setPicked} />
        <ExploreSide
          trip={trip}
          saved={saved}
          signedIn={signedIn}
          busy={busy}
          onToggleSave={() =>
            startSave(async () => {
              await toggleSaved(trip.id, !saved.includes(trip.id));
            })
          }
        />
      </div>

      <a
        href="#match"
        className="mx-auto mt-6 flex w-fit flex-col items-center gap-1 text-ink-soft hover:text-ink"
      >
        <span className="typed">Keep on exploring</span>
        <svg width="18" height="18" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m3.5 5.5 3.5 3.5 3.5-3.5" />
        </svg>
      </a>

      <section id="match" className="mt-8 scroll-mt-20">
        <h2 className="mb-4 text-[clamp(1.5rem,3vw,2.1rem)]">Find the one for your group</h2>
        <div className="grid items-start gap-5 lg:grid-cols-[1fr_1.1fr]">
          <ExploreQuiz answers={answers} onAnswer={answer} />
          <div className="flex flex-col gap-2.5">
            <ExploreMatches matches={rankMatches(PRESET_TRIPS, answers, MATCH_COUNT)} onPick={pickFromMatch} />
            {signedIn ? null : (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-dashed border-pen-edge bg-pen-soft p-4 text-pen-deep">
                <p>
                  <strong>Keep these matches</strong>{" "}
                  <span className="text-[13px]">— your answers are here next time.</span>
                </p>
                <ButtonLink href="/signup" variant="primary">
                  Sign up to save
                </ButtonLink>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
