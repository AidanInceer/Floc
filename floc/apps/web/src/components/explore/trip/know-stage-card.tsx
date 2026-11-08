import type { KnowStage, KnowStageName } from "@floc/core/trip/explore/know/know-types";
import { stageMeta, stageSummary } from "@floc/core/trip/explore/know/stage-summary";

import { KnowGlyphIcon, type KnowGlyphName } from "@/components/system/icons/know";
import { KnowTipRow, type TipRow } from "./know-tip";

const STAGE_ICON: Record<KnowStageName, KnowGlyphName> = {
  "Before you book": "ticket",
  "Before you fly": "plane",
  Landing: "pin",
  Money: "money",
  "On the road": "car",
  "At the stops": "pin",
  "Staying well": "health",
  "Every day": "chat",
};

function rowsOf(stage: KnowStage): TipRow[] {
  if (stage.stage === "At the stops") {
    return stage.stops.flatMap((stop) => stop.tips.map((tip): TipRow => ({ ...tip, icon: "pin", place: stop.place })));
  }
  return stage.tips;
}

export function KnowStageCard({ stage }: { stage: KnowStage }) {
  const summary = stageSummary(stage);
  return (
    <details className="group rounded-md border border-rule bg-sheet transition-[transform,box-shadow] duration-[220ms] ease-[var(--ease)] not-open:hover:shadow-raised not-open:motion-safe:hover:-translate-y-[1.5px]">
      <summary className="group/head grid cursor-pointer list-none grid-cols-[30px_minmax(0,1fr)_14px] items-center gap-x-3.5 gap-y-1 px-4 py-3.5 text-left [&::-webkit-details-marker]:hidden lg:grid-cols-[30px_15rem_minmax(0,1fr)_14px] lg:gap-x-4 lg:px-5 lg:py-4">
        <span className="grid size-[30px] place-items-center rounded-sm bg-sheet-2 text-ink-soft group-open:bg-pen-soft group-open:text-pen-deep">
          <KnowGlyphIcon name={STAGE_ICON[stage.stage]} />
        </span>
        <span className="flex min-w-0 flex-col items-start gap-0.5">
          <h3 className="font-display text-lg font-semibold tracking-[-0.015em] transition-colors duration-[220ms] ease-[var(--ease)] group-hover/head:text-pen">{stage.stage}</h3>
          <span className="typed">{stageMeta(summary)}</span>
        </span>
        <span aria-hidden="true" className="col-span-2 col-start-2 row-start-2 truncate text-sm text-ink-faint group-open:hidden lg:col-span-1 lg:col-start-3 lg:row-start-1">{summary.peek}</span>
        <KnowGlyphIcon name="chevron" className="col-start-3 row-start-1 text-ink-faint transition-transform duration-[220ms] ease-[var(--ease)] group-open:rotate-180 lg:col-start-4" />
      </summary>
      <ol className="px-4 pt-1 pb-4 lg:pl-[66px] lg:pr-5 lg:pb-5">
        {rowsOf(stage).map((tip) => (
          <KnowTipRow key={`${tip.place ?? ""}${tip.title}`} tip={tip} />
        ))}
      </ol>
    </details>
  );
}
