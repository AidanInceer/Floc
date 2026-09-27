import type { CSSProperties } from "react";

import { cx } from "@/components/system/ui";
import type { ProStage } from "@/lib/landing/pro-tour";

export function ProStepper({ stages, at, onPick }: { stages: ProStage[]; at: number; onPick: (i: number) => void }) {
  return (
    <ol
      aria-label="Stages of a trip"
      className="pro-steps relative mx-auto mt-9 grid max-w-[56rem] grid-cols-4"
      style={{ "--at": at, "--n": stages.length } as CSSProperties}
    >
      {stages.map((stage, i) => (
        <li key={stage.name}>
          <button
            type="button"
            aria-current={i === at ? "step" : undefined}
            onClick={() => onPick(i)}
            className="group relative z-[1] grid w-full justify-items-center gap-0.5 pb-1"
          >
            <i
              className={cx(
                "size-6 rounded-full bg-sheet transition-[border-color,transform] duration-300",
                i === at ? "scale-110 border-[7px] border-pen" : i < at ? "border-[3px] border-pen" : "border-[3px] border-rule-strong group-hover:border-pen",
              )}
            />
            <b className={cx("mt-1.5 font-display text-[13px] font-semibold sm:text-base", i === at && "text-pen")}>{stage.name}</b>
            <span className="hidden text-sm text-ink-faint sm:block">{stage.what}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}
