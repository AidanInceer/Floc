import type { ReactNode } from "react";

import { CheckIcon } from "@/components/system/icons";
import { cx } from "@/components/system/ui";

const tileBase = "lift min-w-0 rounded-sm border border-rule bg-sheet text-sm leading-tight transition-colors duration-220 ease-(--ease) hover:border-pen";

export function ChoiceTile({ picked, label, icon, onPick }: { picked: boolean; label: string; icon: ReactNode; onPick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={picked}
      onClick={onPick}
      className={cx(tileBase, "grid flex-1 basis-[5.25rem] justify-items-center gap-1.5 px-1.5 pb-2.5 pt-3 text-center", picked ? "text-pen-deep" : "text-ink-soft")}
    >
      <span className={cx("grid size-9 place-items-center rounded-sm transition-colors duration-220 ease-(--ease)", picked ? "bg-pen-soft text-pen-deep" : "bg-sheet-3 text-ink-soft")}>
        {picked ? <CheckIcon /> : icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

export function ChoiceWord({ picked, label, onPick }: { picked: boolean; label: string; onPick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={picked}
      onClick={onPick}
      className={cx(tileBase, "flex h-10 items-center justify-center gap-1.5 px-1.5", picked ? "bg-pen-soft text-pen-deep" : "text-ink-soft")}
    >
      {picked ? <CheckIcon size={11} /> : null}
      <span className="truncate">{label}</span>
    </button>
  );
}

export function ChoiceRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="grid gap-1.5">
      <span className="typed" aria-hidden="true">{label}</span>
      <div className="grid auto-cols-fr grid-flow-col gap-2">{children}</div>
    </div>
  );
}
