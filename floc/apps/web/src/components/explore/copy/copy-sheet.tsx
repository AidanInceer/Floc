"use client";

import { monthOf, thisMonth } from "@floc/core/dates/availability";
import { today, type IsoDate } from "@floc/core/dates/dates";
import { copySteps, stepBack, stepOn, type CopyStep, type HasDates } from "@floc/core/trip/explore/copy/copy-steps";
import { startMonths } from "@floc/core/trip/explore/copy/start-months";
import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { startTripFromPreset } from "@/app/explore/actions";
import { AskStep } from "@/components/explore/copy/ask-step";
import { ExtrasStep } from "@/components/explore/copy/extras-step";
import { UndatedStep } from "@/components/explore/copy/undated-step";
import { WhenStep } from "@/components/explore/copy/when-step";
import { Sheet, SubmitButton } from "@/components/system/client-ui";
import { Button, SheetFooter, cx } from "@/components/system/ui";

function StepBar({ at, of }: { at: number; of: number }) {
  return (
    <div className="flex items-center gap-2 px-4 pt-3">
      {Array.from({ length: of }, (_, i) => (
        <i key={i} className={cx("h-[3px] flex-1 rounded-full", i <= at ? "bg-pen" : "bg-rule-strong")} />
      ))}
      <span className="nums text-[11px] text-ink-faint">
        {at + 1} of {of}
      </span>
    </div>
  );
}

function CopyForm({ trip }: { trip: PresetTrip }) {
  const months = startMonths(trip, today());
  const [has, setHas] = useState<HasDates>(null);
  const [step, setStep] = useState<CopyStep>("ask");
  const [start, setStart] = useState<IsoDate | null>(null);
  const [month, setMonth] = useState(months[0] ? monthOf(months[0].startDate) : thisMonth());
  const steps = copySteps(has);
  const back = () => setStep(stepBack(step, has));
  const answer = (yes: boolean) => {
    setHas(yes);
    setStep(stepOn("ask", yes));
  };
  const body = useRef<HTMLDivElement>(null);
  const moved = useRef(false);
  useEffect(() => {
    // Why: the pressed control hides with its step, so focus would fall to the page; land it on the new step's question.
    if (moved.current) body.current?.querySelector<HTMLElement>(`[data-step="${step}"] h3`)?.focus();
    moved.current = true;
  }, [step]);
  const backButton = <Button type="button" variant="ghost" onClick={back}>Back</Button>;
  const start_ = <SubmitButton pendingLabel="Starting…" className="whitespace-nowrap">Start trip</SubmitButton>;
  const footer: Record<CopyStep, ReactNode> = {
    ask: null,
    when: (
      <span className="flex gap-2">
        {backButton}
        <Button type="button" variant="primary" disabled={!start} onClick={() => setStep("extras")}>Next</Button>
      </span>
    ),
    extras: <span className="flex gap-2">{backButton}{start_}</span>,
    undated: <span className="flex gap-2">{backButton}{start_}</span>,
  };

  return (
    <form action={startTripFromPreset} className="flex min-h-0 flex-1 flex-col">
      <input type="hidden" name="presetId" value={trip.id} />
      {has && start ? <input type="hidden" name="start" value={start} /> : null}
      <StepBar at={steps.indexOf(step)} of={steps.length} />
      <div ref={body} className="scroll-thin min-h-0 flex-1 overflow-y-auto p-4">
        <div data-step="ask" hidden={step !== "ask"}><AskStep nights={trip.nights} onAnswer={answer} /></div>
        <div data-step="when" hidden={step !== "when"}>
          <WhenStep months={months} nights={trip.nights} start={start} month={month} onStart={setStart} onMonth={setMonth} />
        </div>
        <div data-step="extras" hidden={step !== "extras"}><ExtrasStep start={start} nights={trip.nights} onChange={back} /></div>
        <div data-step="undated" hidden={step !== "undated"}><UndatedStep highlights={trip.highlights} /></div>
      </div>
      <div className={step === "ask" ? "max-sm:hidden" : undefined}>
        <SheetFooter note={step === "when" ? null : <span className="max-sm:hidden">You can change all of it later.</span>}>{footer[step]}</SheetFooter>
      </div>
    </form>
  );
}

/** "Start this trip" on Explore (ADR-025): do you have dates yet, then when, then what else comes across. */
export function CopySheet({
  trip,
  children,
  className,
  defaultOpen,
}: {
  trip: PresetTrip;
  /** The trigger's words. */
  children: ReactNode;
  className?: string;
  /** Open on arrival: a link from the landing page asked for it. */
  defaultOpen?: boolean;
}) {
  return (
    <Sheet trigger={children} title="Start this trip" triggerClassName={className} defaultOpen={defaultOpen} body="flush" keepOpenOnSubmit>
      <CopyForm trip={trip} />
    </Sheet>
  );
}
