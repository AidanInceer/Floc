"use client";

/**
 * The first-trip walkthrough (wireframe/trip-onboarding E5c, #315). Say what is sorted; the step
 * to start on shows as a card in its feature's wash, with the page it opens drawn small. Closing
 * it any way at all — Skip, the cross, Escape, or going — marks it seen for good (#314).
 */
import { useRouter } from "next/navigation";
import { useState } from "react";

import { markTourSeen } from "@/app/trip/[id]/overview/actions";
import { Dialog, DialogClose } from "@/components/system/dialog";
import { CheckIcon } from "@/components/system/icons";
import { StepGlyph } from "@/components/system/icons/walkthrough";
import { AvatarRow, Button, cx } from "@/components/system/ui";
import { chipsFor, sortedAtStart, thenLine, walkthroughSteps, welcomeLine, type Sorted, type WalkthroughStep } from "@floc/core/trip/walkthrough";
import { WalkthroughPreview, type PreviewData } from "./walkthrough-preview";

const DIALOG =
  "m-auto w-full max-w-lg overflow-y-auto rounded-md border border-rule bg-sheet p-0 text-ink shadow-lifted backdrop:bg-black/40 max-h-[calc(100dvh-48px)] max-sm:mb-0 max-sm:max-h-[92dvh] max-sm:max-w-full max-sm:rounded-b-none";

/** Where (Ideas) is blue, When (Dates) is yellow; the invite is yours to do, so pen. */
const WASH: Record<string, { card: string; ink: string }> = {
  ideas: { card: "bg-pastel-blue", ink: "text-pastel-blue-ink" },
  invite: { card: "bg-pen-soft", ink: "text-pen-deep" },
  dates: { card: "bg-pastel-yellow", ink: "text-pastel-yellow-ink" },
};

type TripFacts = { id: number; name: string; joined: boolean; datesSet: boolean; placesSet: boolean };

export function WalkthroughDialog({ trip, firstName, preview }: { trip: TripFacts; firstName: string; preview: PreviewData }) {
  const { id: tripId, name: tripName, joined } = trip;
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [sorted, setSorted] = useState<Sorted>(() => sortedAtStart(trip));
  const steps = walkthroughSteps(sorted, joined);
  const start = steps[0] as WalkthroughStep;

  const close = () => {
    setOpen(false);
    void markTourSeen();
  };
  const go = () => {
    close();
    if (start.key === "ideas") landOnIdeas();
    else if (start.key === "invite") landOnInvite();
    else router.push(`/trip/${tripId}/dates`);
  };

  return (
    <Dialog open={open} onClose={close} title="Welcome to Floc" className={DIALOG}>
      <header className="flex items-center justify-between pl-5 pr-3 pt-2.5 max-sm:pl-4 max-sm:pr-2">
        <span className="truncate font-mono text-[13px] text-ink-faint">{tripName}</span>
        <DialogClose />
      </header>
      <div className="px-5 pb-3.5 max-sm:px-4">
        {joined ? <div className="mb-3"><AvatarRow people={preview.group} max={5} size={32} /></div> : null}
        <h2 className="font-display text-[22px] leading-tight">Welcome to Floc, {firstName}.</h2>
        <p className="mt-1 text-sm text-ink-soft">
          {welcomeLine(tripName, joined)}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 px-5 max-sm:px-4">
        {chipsFor(joined).map((chip) => {
          const on = sorted[chip.key];
          return (
            <button
              key={chip.key}
              type="button"
              aria-pressed={on}
              onClick={() => setSorted((s) => ({ ...s, [chip.key]: !s[chip.key] }))}
              className={cx(
                "inline-flex items-center gap-1.5 rounded-full border py-1.5 pl-2.5 pr-3 text-[13px] transition-colors",
                on ? "border-pastel-green-edge bg-pastel-green text-pastel-green-ink" : "border-rule-strong bg-sheet text-ink-soft hover:border-pen hover:text-ink",
              )}
            >
              {on ? <CheckIcon size={14} /> : <StepGlyph step={chip.key} />}
              {chip.label}
            </button>
          );
        })}
      </div>

      <div className="px-5 pt-4 max-sm:px-4" aria-live="polite">
        <StartCard key={`${start.key}-${sorted.when}`} step={start} datesSet={sorted.when} preview={preview} />
      </div>
      {steps.length > 1 ? <p className="mx-5 mt-2.5 text-[13px] text-ink-soft max-sm:mx-4">{thenLine(steps)}</p> : null}

      <footer className="mt-4 flex items-center justify-between gap-2 border-t border-rule px-5 py-3 max-sm:px-4">
        <button type="button" onClick={close} className="-ml-2.5 rounded-sm px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint transition-colors hover:text-pen">
          Skip
        </button>
        <Button variant="primary" onClick={go} className="max-sm:flex-1 max-sm:max-w-56">
          Go to {start.place}
        </Button>
      </footer>
    </Dialog>
  );
}

function scrollTo(el: Element) {
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ block: "start", behavior: still ? "auto" : "smooth" });
}

/**
 * Why it opens what it lands on: Ideas is a fold while the plan is loose and a row that opens a
 * sheet once it has a shape (`ideasTucked`); "Go to Ideas" should show the ideas, not a closed
 * door. A tucked row with no ideas draws nothing, so then it lands on the trip card that holds it.
 */
function landOnIdeas() {
  const el = document.getElementById("ideas");
  if (!el) {
    const card = document.querySelector("[data-overview-card]");
    if (card) scrollTo(card);
    return;
  }
  if (el instanceof HTMLDetailsElement) el.open = true;
  else el.querySelector("button")?.click();
  scrollTo(el);
}

/** Opens the group's own Invite sheet, the one door for sharing the trip. */
function landOnInvite() {
  const group = document.getElementById("the-group");
  if (!group) return;
  scrollTo(group);
  [...group.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Invite")?.click();
}

function StartCard({ step, datesSet, preview }: { step: WalkthroughStep; datesSet: boolean; preview: PreviewData }) {
  const wash = WASH[step.key] ?? WASH.ideas!;
  return (
    <div className={cx("overflow-hidden rounded-md transition-[opacity,translate] duration-[220ms] ease-[var(--ease)] starting:translate-y-1.5 starting:opacity-0 motion-reduce:transition-none", wash.card)}>
      <div className={cx("grid grid-cols-[34px_minmax(0,1fr)] items-center gap-3 px-3.5 pb-2.5 pt-3", wash.ink)}>
        <span className="grid size-[34px] place-items-center rounded-sm bg-sheet">
          <StepGlyph step={step.key} size={16} />
        </span>
        <span className="grid min-w-0 gap-0.5">
          <span className="flex flex-wrap items-baseline gap-x-2.5">
            <b className="text-[15px] font-semibold">{step.title}</b>
            <span className="font-mono text-[11px]">Start here</span>
          </span>
          <span className="text-[13px] opacity-85">{step.line}</span>
        </span>
      </div>
      <div className="m-1 mt-0 flex min-h-[5.5rem] items-center rounded-sm bg-sheet p-3">
        <WalkthroughPreview step={step.key} datesSet={datesSet} data={preview} />
      </div>
    </div>
  );
}
