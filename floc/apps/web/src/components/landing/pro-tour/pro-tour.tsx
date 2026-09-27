"use client";

import { useRef, useState } from "react";

import { PRO_STAGES, stageNotes, type ProFeatureKey } from "@/lib/landing/pro-tour";

import { ProNotes } from "./pro-notes";
import { BrowserScreen, PhoneScreen } from "./pro-screens";
import { ProStepper } from "./pro-stepper";
import { useLeaderLines } from "./use-leader-lines";
import { useStageTour } from "./use-stage-tour";

/**
 * Pro across one sample trip: the web page on a wide screen, the phone on a
 * narrow one, where a browser window squeezed down reads worse than a phone.
 */
export function ProTour() {
  const { ref, at, pick } = useStageTour(PRO_STAGES.length);
  const [hot, setHot] = useState<ProFeatureKey | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const { width, height, lines } = useLeaderLines(stageRef, at);

  const stage = PRO_STAGES[at] ?? PRO_STAGES[0]!;
  const notes = stageNotes(stage);
  const screen = { stage, notes, hot };

  return (
    <div ref={ref}>
      <ProStepper stages={PRO_STAGES} at={at} onPick={pick} />
      <div
        ref={stageRef}
        className="relative mx-auto mt-9 grid max-w-[35rem] gap-6 lg:max-w-none lg:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,35rem)_minmax(0,1fr)] xl:gap-10"
      >
        <div
          role="img"
          aria-label={`Sample trip, ${stage.name.toLowerCase()}: ${stage.rows.map((r) => r.title).join(", ")}`}
          className="lg:col-span-2 xl:col-span-1 xl:col-start-2 xl:row-start-1"
        >
          <div className="lg:hidden">
            <PhoneScreen {...screen} />
          </div>
          <div className="mx-auto hidden max-w-[35rem] lg:block">
            <BrowserScreen {...screen} />
          </div>
        </div>
        <ProNotes inPro notes={notes.filter((n) => n.inPro)} onHot={setHot} className="xl:col-start-1 xl:row-start-1 xl:justify-items-end xl:pt-10" />
        <ProNotes inPro={false} notes={notes.filter((n) => !n.inPro)} onHot={setHot} className="xl:col-start-3 xl:row-start-1 xl:pt-10" />
        <svg
          aria-hidden
          viewBox={`0 0 ${width || 1} ${height || 1}`}
          className="pro-wires pointer-events-none absolute inset-0 z-[2] hidden size-full overflow-visible xl:block"
        >
          {lines.map((l) => (
            <g key={l.key} data-soon={l.soon ? "" : undefined}>
              <path d={l.d} />
              <circle cx={l.x} cy={l.y} r="3" />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
