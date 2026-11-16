import Link from "next/link";

import { FitBadge } from "@/components/money/estimate/estimate-marks";
import { NavGlyph } from "@/components/system/icons/nav";
import type { EstimateView } from "@/server/money/estimate/estimate-view";
import { fitWords, wholeRange } from "@floc/core/money/estimate/words";

const CHEVRON = (
  <svg viewBox="0 0 14 14" className="size-[13px]" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5.6 4.2 8.4 7l-2.8 2.8" />
  </svg>
);

export function EstimateBanner({ tripId, view }: { tripId: number; view: EstimateView }) {
  const { plan, currency } = view;
  return (
    <Link
      href={`/trip/${tripId}/money?view=budget`}
      className="lift flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border border-rule bg-sheet px-4 py-3 text-ink"
    >
      <span className="grid size-[26px] shrink-0 place-items-center rounded-sm bg-pastel-red text-pastel-red-ink">
        <NavGlyph name="money" />
      </span>
      <span className="text-[15px]">
        {view.places ? <><span className="font-mono font-semibold">{wholeRange(plan.total, currency)}</span> for you</> : "Add a place to see what this trip will cost you"}
      </span>
      {plan.fit ? <span className="max-sm:order-last max-sm:basis-full"><FitBadge fit={plan.fit} words={fitWords(plan.fit, currency)} /></span> : null}
      <span className="ml-auto inline-flex items-center gap-1 text-[13px] text-pen">Budget {CHEVRON}</span>
    </Link>
  );
}
