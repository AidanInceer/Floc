"use client";

import { useState, useTransition } from "react";

import { saveTravelForm } from "@/app/trip/[id]/money/estimate-actions";
import { Menu } from "@/components/system/client-ui";
import { CheckIcon, ChevronIcon } from "@/components/system/icons";
import { TravelModeIcon } from "@/components/system/icons/travel-mode";
import { busyMark, cx, menuItemClass, pressArea } from "@/components/system/ui";
import { TRAVEL_GLYPHS, TRAVEL_LABELS, TRAVEL_MODES, type TravelMode } from "@floc/core/money/estimate/travel";

const TRIGGER = "inline-flex h-[26px] w-fit items-center gap-1 rounded-sm border border-rule-strong bg-sheet px-2 text-[15px] text-ink hover:border-pen hover:bg-pen-soft hover:text-pen-deep data-[open=true]:border-pen data-[open=true]:bg-pen-soft data-[open=true]:text-pen-deep";

export function TravelPicker({ tripId, travel }: { tripId: number; travel: TravelMode }) {
  const [pending, start] = useTransition();
  const [problem, setProblem] = useState<string | null>(null);
  const pick = (mode: TravelMode) =>
    start(async () => {
      const form = new FormData();
      form.set("travel", mode);
      const { error } = await saveTravelForm(tripId, form);
      setProblem(error ?? null);
    });
  return (
    <div className="grid justify-items-start gap-1">
      <Menu
        label={`How you get there: ${TRAVEL_LABELS[travel]}`}
        align="left"
        trigger={<>{TRAVEL_LABELS[travel]}{busyMark(pending)}<ChevronIcon direction="down" /></>}
        triggerClassName={cx(pressArea, TRIGGER)}
      >
        {TRAVEL_MODES.map((mode) => (
          <form key={mode} onSubmit={(event) => { event.preventDefault(); pick(mode); }}>
            <button type="submit" role="menuitemradio" aria-checked={mode === travel} className={cx(menuItemClass, mode === travel && "!bg-pen-soft !text-pen-deep")}>
              <span className="flex min-w-32 items-center gap-2">
                <TravelModeIcon mode={TRAVEL_GLYPHS[mode]} />
                <span className="flex-1">{TRAVEL_LABELS[mode]}</span>
                {mode === travel ? <CheckIcon size={12} /> : null}
              </span>
            </button>
          </form>
        ))}
      </Menu>
      {problem ? <span role="alert" className="text-[13px] text-red">{problem}</span> : null}
    </div>
  );
}
