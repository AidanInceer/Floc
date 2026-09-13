"use client";

import {
  EXPLORE_QUESTIONS,
  NIGHTS,
  type ExploreAnswers,
  type ExploreQuestion,
} from "@floc/core/trip/explore/explore-match";

import { Button } from "@/components/system/ui";

function nightsLabel(nights: number): string {
  return nights >= NIGHTS.max ? "Any length" : `Up to ${nights} nights`;
}

const KEYS = Object.keys(EXPLORE_QUESTIONS) as ExploreQuestion[];

export function ExploreQuiz({
  answers,
  onAnswer,
}: {
  answers: ExploreAnswers;
  onAnswer: (next: ExploreAnswers) => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-rule bg-sheet p-5 shadow-[var(--shadow)]">
      {KEYS.map((key) => (
        <fieldset key={key}>
          <legend className="typed">{EXPLORE_QUESTIONS[key].label}</legend>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {Object.entries(EXPLORE_QUESTIONS[key].options).map(([value, label]) => {
              const on = answers[key] === value;
              return (
                <Button
                  key={value}
                  type="button"
                  variant={on ? "primary" : "secondary"}
                  aria-pressed={on}
                  onClick={() => onAnswer({ ...answers, [key]: value })}
                >
                  {label}
                </Button>
              );
            })}
          </div>
        </fieldset>
      ))}
      <label className="block">
        <span className="flex items-baseline justify-between">
          <span className="typed">{NIGHTS.label}</span>
          <span className="nums text-sm">{nightsLabel(answers.nights)}</span>
        </span>
        <input
          type="range"
          min={NIGHTS.min}
          max={NIGHTS.max}
          step={1}
          value={answers.nights}
          onChange={(e) => onAnswer({ ...answers, nights: Number(e.target.value) })}
          aria-valuetext={nightsLabel(answers.nights)}
          className="mt-2 w-full accent-pen"
        />
        <span className="nums mt-1 flex justify-between text-xs text-ink-faint">
          <span>{NIGHTS.min} nights</span>
          <span>Any</span>
        </span>
      </label>
    </div>
  );
}
