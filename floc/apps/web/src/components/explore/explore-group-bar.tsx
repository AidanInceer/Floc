"use client";

import { NIGHTS, type ExploreAnswers, type ExploreQuestion } from "@floc/core/trip/explore/explore-match";

import { PillToggle } from "@/components/system/client-ui";

// Why: shorter than the shared EXPLORE_QUESTIONS words so the whole bar fits one line; the phone keeps its own.
const CONTROLS: { key: ExploreQuestion; label: string; options: Record<string, string> }[] = [
  { key: "size", label: "Group", options: { "2-4": "2–4", "5-8": "5–8", "9+": "9+" } },
  { key: "when", label: "When", options: { spring: "Spring", summer: "Summer", autumn: "Autumn", any: "Any" } },
  { key: "cost", label: "Each", options: { "under-500": "<500", "500-1000": "500–1k", more: "1k+" } },
  { key: "pace", label: "Pace", options: { base: "One base", move: "Moving" } },
];

const label = "typed text-ink-faint";

function nightsLabel(nights: number): string {
  return nights >= NIGHTS.max ? "Any" : `≤ ${nights}`;
}

export function ExploreGroupBar({
  answers,
  goodFits,
  changed,
  onAnswer,
  onReset,
}: {
  answers: ExploreAnswers;
  goodFits: number;
  changed: boolean;
  onAnswer: (next: ExploreAnswers) => void;
  onReset: () => void;
}) {
  return (
    <div className="z-10 border-b border-rule bg-paper/95 backdrop-blur lg:sticky lg:top-[57px]">
      <div className="mx-auto flex max-w-[76rem] flex-wrap items-center gap-x-4 gap-y-2.5 px-4 py-3 sm:px-6">
        {CONTROLS.map(({ key, label: name, options }) => (
          <div key={key} className="flex items-center gap-2">
            <span className={label}>{name}</span>
            <PillToggle
              label={name}
              value={answers[key] as string}
              options={Object.entries(options).map(([value, text]) => ({ value, label: text }))}
              onChange={(value) => onAnswer({ ...answers, [key]: value })}
              className="w-auto gap-0 [&>button]:flex-none [&>button]:px-2.5 [&>button]:py-1 [&>button]:text-xs"
            />
          </div>
        ))}
        <div className="flex items-center gap-2">
          <label htmlFor="explore-nights" className={label}>
            Nights
          </label>
          <input
            id="explore-nights"
            type="range"
            min={NIGHTS.min}
            max={NIGHTS.max}
            step={1}
            value={answers.nights}
            onChange={(e) => onAnswer({ ...answers, nights: Number(e.target.value) })}
            aria-valuetext={answers.nights >= NIGHTS.max ? "Any length" : `Up to ${answers.nights} nights`}
            className="w-20 accent-ink"
          />
          <span className="nums w-7 text-[13px]">{nightsLabel(answers.nights)}</span>
        </div>
        <p className="flex items-baseline gap-1.5 text-[13px] text-ink-soft lg:ml-auto">
          <b className="nums font-display text-xl font-semibold text-green">{goodFits}</b>
          good {goodFits === 1 ? "fit" : "fits"}
          {changed ? (
            <button type="button" onClick={onReset} className="ml-1.5 text-xs text-ink-faint underline underline-offset-[3px] hover:text-ink">
              Reset
            </button>
          ) : null}
        </p>
      </div>
    </div>
  );
}
