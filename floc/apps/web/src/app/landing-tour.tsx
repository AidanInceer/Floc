"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { cx } from "@/components/system/ui";
import { FlockChevron } from "@/components/system/flock-chevron";
import { stepTo, tourAnswerAt, tourBeats } from "@/lib/landing-tour";
import type { TourStop } from "./landing-content";
import { PlayLine, ProTag, StopIcon, TourChat } from "./landing-tour-parts";
import type { TourPhase } from "./landing-tour-parts";
import { TourLink } from "./landing-tour-link";

const settled = (messages: number): TourPhase => ({ shown: messages, typing: false, answered: true });

function useStill() {
  const [still, setStill] = useState(false);
  useEffect(() => setStill(matchMedia("(prefers-reduced-motion: reduce)").matches), []);
  return still;
}

/** Nothing plays until someone picks a stop; before that the first one sits answered. */
function useTour(stops: TourStop[], run: number, still: boolean) {
  const [current, setCurrent] = useState(0);
  const [phase, setPhase] = useState<TourPhase>(settled(stops[0].chat.length));
  const messages = stops[current].chat.length;

  useEffect(() => {
    if (run === 0 || still) {
      setPhase(settled(messages));
      return;
    }
    setPhase({ shown: 0, typing: false, answered: false });
    const timers = tourBeats(messages)
      .filter((beat) => beat.kind !== "next")
      .map((beat) =>
        setTimeout(() => setPhase({ shown: beat.shown, typing: beat.kind === "typing", answered: beat.kind === "answer" }), beat.at),
      );
    return () => timers.forEach(clearTimeout);
  }, [current, messages, run, still]);

  return { current, setCurrent, phase };
}

export function LandingTour({ stops }: { stops: TourStop[] }) {
  const [run, setRun] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const tile = useRef<HTMLButtonElement>(null);
  const chat = useRef<HTMLDivElement>(null);
  const still = useStill();
  const { current, setCurrent, phase } = useTour(stops, run, still);
  const stop = stops[current];
  const duration = tourAnswerAt(stop.chat.length);
  const line = run > 0 ? <PlayLine key={`${current}-${run}`} duration={duration} still={still} /> : null;

  const pick = (index: number) => {
    setRun((r) => r + 1);
    setCurrent(index);
  };

  return (
    <div ref={root} className="relative grid gap-7 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <TourLink root={root} from={tile} to={chat} pick={current} />
      <ul className="hidden gap-2 md:grid">
        {stops.map((s, i) => (
          <li key={s.title}>
            <button
              ref={i === current ? tile : undefined}
              type="button"
              aria-pressed={i === current}
              onClick={() => pick(i)}
              className={cx(
                "group relative grid w-full grid-cols-[2.25rem_1fr_auto] items-center gap-3 rounded-md border px-3.5 pb-3.5 pt-3 text-left transition-[border-color,box-shadow,background-color,translate]",
                i === current
                  ? "border-ink bg-sheet shadow-raised"
                  : "border-rule bg-sheet-2 hover:-translate-y-px hover:border-rule-strong hover:bg-sheet hover:shadow-raised",
              )}
            >
              <StopIcon stop={s} />
              <span>
                <b className="block text-[15px] font-semibold">{s.title}</b>
                <small className="text-sm text-ink-soft">{s.line}</small>
              </span>
              <ProTag stop={s} />
              {i === current ? (
                <span className="absolute inset-x-3.5 bottom-1.5 left-[3.75rem]">
                  {line}
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>

      <div>
        <div className="md:sticky md:top-[max(5rem,calc(50vh-14.5rem))]">
          <div ref={chat}>
            <TourChat stop={stop} phase={phase} />
          </div>
          <TourControls
            stop={stop}
            position={`${current + 1} of ${stops.length}`}
            onStep={(delta) => pick(stepTo(current, delta, stops.length))}
            line={line}
          />
        </div>
      </div>
    </div>
  );
}

function TourControls({
  stop,
  position,
  onStep,
  line,
}: {
  stop: TourStop;
  position: string;
  onStep: (delta: number) => void;
  line: ReactNode;
}) {
  const round = "grid size-10 place-items-center rounded-full border border-rule-strong bg-sheet";
  return (
    <div className="mt-3 grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-2 md:hidden">
      <button type="button" className={round} aria-label="Previous feature" onClick={() => onStep(-1)}>
        <FlockChevron size={11} className="rotate-90" />
      </button>
      <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
        <span className="flex max-w-full items-center gap-1.5 truncate text-sm font-semibold">
          {stop.title}
          <ProTag stop={stop} />
        </span>
        {line}
        <span className="typed">{position}</span>
      </div>
      <button type="button" className={round} aria-label="Next feature" onClick={() => onStep(1)}>
        <FlockChevron size={11} className="-rotate-90" />
      </button>
    </div>
  );
}
