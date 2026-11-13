/**
 * Why: open while the dates are unset, shut once they are set — a decided trip
 * keeps its ideas, it just stops shouting about them.
 */
import { ChevronIcon } from "@/components/system/icons";
import { IdeasBoard } from "./ideas-board";
import type { IdeaRow } from "@floc/core/trip/ideas";

export function IdeasPanel({
  tripId,
  ideas,
  datesUnset,
}: {
  tripId: number;
  ideas: IdeaRow[];
  datesUnset: boolean;
}) {
  return (
    <details
      id="ideas"
      open={datesUnset}
      className="group/ideas mb-4 scroll-mt-24 overflow-hidden rounded-md border border-rule bg-sheet"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <ChevronIcon direction="down" size={15} className="shrink-0 -rotate-90 text-ink-faint transition-transform group-open/ideas:rotate-0" />
        <h2 className="font-display text-lg">Ideas</h2>
        {ideas.length > 0 ? (
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint">
            {ideas.length === 1 ? "1 idea" : `${ideas.length} ideas`}
          </span>
        ) : null}
      </summary>

      <IdeasBoard tripId={tripId} ideas={ideas} />
    </details>
  );
}
