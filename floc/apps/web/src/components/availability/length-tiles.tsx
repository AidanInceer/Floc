"use client";

import { useState, useTransition } from "react";

import { AsideHead } from "@/components/availability/dates-board-parts";
import { CheckIcon } from "@/components/system/icons";
import { cx } from "@/components/system/ui";
import { DATES_NOT_SAVED } from "@floc/core/dates/words";
import {
  TRIP_LENGTHS,
  TRIP_LENGTH_SPECS,
  lengthSummary,
  picksLength,
  type LengthChoice,
  type TripLength,
} from "@floc/core/dates/finding/trip-length";

type Picks = Record<TripLength, boolean>;

const picksOf = (choices: LengthChoice[], viewerId: string) =>
  Object.fromEntries(TRIP_LENGTHS.map((length) => [length, picksLength(choices, viewerId, length)])) as Picks;

function withMine(choices: LengthChoice[], viewerId: string, mine: Picks): LengthChoice[] {
  const own = TRIP_LENGTHS.filter((length) => mine[length]).map((length) => ({ userId: viewerId, length }));
  return [...choices.filter((c) => c.userId !== viewerId), ...own];
}

export function LengthTiles({
  choices,
  viewerId,
  save,
}: {
  choices: LengthChoice[];
  viewerId: string;
  save: (length: TripLength, picked: boolean) => Promise<void>;
}) {
  const [mine, setMine] = useState(() => picksOf(choices, viewerId));
  const [failed, setFailed] = useState(false);
  const [, startTransition] = useTransition();
  const summary = lengthSummary(withMine(choices, viewerId, mine));

  const press = (length: TripLength) => {
    const was = mine[length];
    setMine({ ...mine, [length]: !was });
    setFailed(false);
    startTransition(async () => {
      try {
        await save(length, !was);
      } catch {
        setMine((now) => ({ ...now, [length]: was }));
        setFailed(true);
      }
    });
  };

  return (
    <div className="p-4">
      <AsideHead title="How long" id="how-long" />
      <div role="group" aria-labelledby="how-long" className="mt-2 flex flex-col gap-1.5">
        {TRIP_LENGTHS.map((length) => {
          const spec = TRIP_LENGTH_SPECS[length];
          const on = mine[length];
          return (
            <button
              key={length}
              type="button"
              aria-pressed={on}
              onClick={() => press(length)}
              className={cx(
                "flex items-center gap-2.5 rounded-sm border bg-sheet px-3 py-2 text-left transition-colors",
                on ? "border-ink-soft text-ink hover:border-ink" : "border-rule text-ink-soft hover:border-ink-soft",
              )}
            >
              <span
                aria-hidden
                className={cx(
                  "grid size-4 shrink-0 place-items-center rounded-full border",
                  on ? "border-ink bg-ink text-sheet" : "border-rule-strong",
                )}
              >
                {on ? <CheckIcon size={10} /> : null}
              </span>
              <span className="flex-1 text-[13px] font-medium text-ink">{spec.label}</span>
              <span className="nums font-mono text-[11px]">{spec.nights}</span>
            </button>
          );
        })}
      </div>
      {failed ? <p className="mt-2 text-[13px] text-red">{DATES_NOT_SAVED}</p> : null}
      {summary ? <p className="mt-2 text-[13px] text-ink-soft">{summary}</p> : null}
    </div>
  );
}
