import type { ReactNode } from "react";

import { ChevronIcon, ClockIcon } from "@/components/system/icons";
import { NavGlyph } from "@/components/system/icons/nav";
import { cx, panelTitleClass } from "@/components/system/ui";

function Choice({ tile, label, hint, onPick }: { tile: ReactNode; label: string; hint: string; onPick: () => void }) {
  return (
    <button type="button" onClick={onPick} className="group flex w-full items-center gap-3 p-3.5 text-left transition-colors hover:bg-pen-soft">
      {tile}
      <span className="min-w-0 flex-1">
        <span className="block text-sm text-ink">{label}</span>
        <span className="mt-0.5 block text-xs text-ink-faint">{hint}</span>
      </span>
      <span className="text-ink-faint group-hover:text-pen-deep">
        <ChevronIcon direction="right" />
      </span>
    </button>
  );
}

const tile = "grid size-[30px] shrink-0 place-items-center rounded-sm";

/** Step one (ADR-025): the trip's dates decide what can come across, so they are asked first. */
export function AskStep({ nights, onAnswer }: { nights: number; onAnswer: (has: boolean) => void }) {
  return (
    <div className="grid gap-4">
      <h3 tabIndex={-1} className={cx(panelTitleClass, "text-center")}>Do you have dates yet?</h3>
      <div className="divide-y divide-rule overflow-hidden rounded-md border border-rule">
        <Choice
          tile={<span className={cx(tile, "bg-pastel-yellow text-pastel-yellow-ink")}><NavGlyph name="dates" /></span>}
          label="Yes"
          hint={`Pick when you go. The ${nights} nights follow.`}
          onPick={() => onAnswer(true)}
        />
        <Choice
          tile={<span className={cx(tile, "bg-sheet-3 text-ink-soft")}><ClockIcon /></span>}
          label="Not yet"
          hint="Start with the highlights. Add dates when the group agrees."
          onPick={() => onAnswer(false)}
        />
      </div>
    </div>
  );
}
