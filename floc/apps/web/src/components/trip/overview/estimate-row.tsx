import Link from "next/link";

import { FitBadge } from "@/components/money/estimate/estimate-marks";
import { ChevronIcon } from "@/components/system/icons";
import { NavGlyph } from "@/components/system/icons/nav";
import type { EstimateView } from "@/server/money/estimate/estimate-view";
import { fitWords, wholeRange } from "@floc/core/money/estimate/words";

export function EstimateRow({ tripId, view }: { tripId: number; view: EstimateView }) {
  const { plan, currency } = view;
  return (
    <Link
      href={`/trip/${tripId}/money?view=budget`}
      aria-label={view.places ? `${wholeRange(plan.total, currency)} estimated for you, open your budget` : "Open your budget"}
      className="flex w-full flex-wrap items-center gap-x-2.5 gap-y-1.5 border-b border-rule py-3 text-left text-sm text-ink-soft hover:text-ink"
    >
      <span className="shrink-0 text-pastel-red-ink">
        <NavGlyph name="money" />
      </span>
      <span className="min-w-0 flex-1 text-ink">
        {view.places ? <><span className="font-mono font-semibold">{wholeRange(plan.total, currency)}</span> estimated for you</> : "Add a place to see what this trip will cost you"}
      </span>
      <ChevronIcon direction="right" size={13} className="text-ink-faint" />
      {plan.fit ? <span className="basis-full pl-6"><FitBadge fit={plan.fit} words={fitWords(plan.fit, currency)} /></span> : null}
    </Link>
  );
}
