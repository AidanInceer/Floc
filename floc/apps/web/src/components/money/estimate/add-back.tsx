"use client";

import { useLineSave } from "@/components/money/estimate/use-line-save";
import { busyMark, cx, pressArea } from "@/components/system/ui";
import type { EstimateLine } from "@floc/core/money/estimate/lines";

export function AddBack({ tripId, line, label }: { tripId: number; line: EstimateLine; label: string }) {
  const { save, pending, problem } = useLineSave(tripId, line);
  return (
    <>
      <button
        type="button"
        disabled={pending}
        aria-busy={pending || undefined}
        aria-label={`Add ${label} back`}
        onClick={() => save({ notNeeded: "false" })}
        className={cx(pressArea, "whitespace-nowrap text-[13px] text-pen hover:underline")}
      >
        Add back{busyMark(pending)}
      </button>
      {problem ? <span role="alert" className="text-[13px] text-red">{problem}</span> : null}
    </>
  );
}
