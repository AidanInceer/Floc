import { Badge, cx, type Tone } from "@/components/system/ui";
import type { BudgetFit, LineProgress, Range } from "@floc/core/money/estimate/budget";

const FIT_TONE: Record<BudgetFit["kind"], Tone> = { fits: "agreed", tight: "open", over: "action" };
const PROGRESS_TONE: Partial<Record<LineProgress["kind"], Tone>> = { "in-range": "agreed", over: "action" };

export function FitBadge({ fit, words }: { fit: BudgetFit; words: string }) {
  return <Badge sentence tone={FIT_TONE[fit.kind]}>{words}</Badge>;
}

export function ProgressBadge({ progress, words }: { progress: LineProgress; words: string }) {
  return <Badge sentence tone={PROGRESS_TONE[progress.kind] ?? "neutral"}>{words}</Badge>;
}

const pct = (v: number, max: number) => `${Math.max(0, Math.min(100, (v / max) * 100))}%`;

/** Spent as an ink fill, the plan as a red wash, the budget as a line. Its words live beside it, never in it. */
export function SpendBar({ spent, plan, budget, label, thin }: { spent: number; plan: Range | null; budget?: number | null; label: string; thin?: boolean }) {
  const max = Math.max(plan?.[1] ?? 0, spent, budget ?? 0) * 1.1 || 1;
  return (
    <span role="img" aria-label={label} className={cx("relative block rounded-full bg-sheet-3", thin ? "h-1.5" : "h-2")}>
      {plan ? (
        <span className="absolute inset-y-0 rounded-full bg-pastel-red-edge ring-1 ring-inset ring-pastel-red-ink/40" style={{ left: pct(plan[0], max), width: pct(plan[1] - plan[0], max), minWidth: 4 }} />
      ) : null}
      <span className="absolute inset-y-0 left-0 rounded-full bg-ink" style={{ width: pct(spent, max) }} />
      {budget != null ? <span className="absolute -inset-y-1 w-0.5 -translate-x-1/2 rounded-sm bg-ink" style={{ left: pct(budget, max) }} /> : null}
    </span>
  );
}
