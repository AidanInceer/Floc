"use client";

import { PRO_STAGES } from "@/lib/landing/pro-tour";

import { ProStepper } from "./pro-stepper";
import { ProWiper } from "./pro-wiper";
import { useStageTour } from "./use-stage-tour";
import "./pro-tour.css";

export function ProTour() {
  const { ref, at, mode, pick, hold } = useStageTour(PRO_STAGES.length);
  const stage = PRO_STAGES[at] ?? PRO_STAGES[0]!;

  return (
    // Why: at either end the grip and the far tag hang past the page edge; clip there, not at the text column.
    <div ref={ref} className="-mx-4 overflow-x-clip px-4 sm:-mx-6 sm:px-6">
      <ProStepper stages={PRO_STAGES} at={at} onPick={pick} />
      <div className="mt-6">
        {/* Keyed by stage, so each stage starts on the free page and sweeps again. */}
        <ProWiper key={at} stage={stage} mode={mode} onHold={hold} />
      </div>
    </div>
  );
}
