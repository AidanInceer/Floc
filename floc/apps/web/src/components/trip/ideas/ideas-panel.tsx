/**
 * Why: open while the dates are unset, shut once they are set — a decided trip
 * keeps its ideas, it just stops shouting about them.
 */
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
      open={datesUnset}
      className="group/ideas mb-4 overflow-hidden rounded-xl border border-rule bg-sheet"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="shrink-0 text-ink-faint transition-transform group-open/ideas:rotate-90">
          <ChevronGlyph />
        </span>
        <h2 className="font-display text-lg">Ideas</h2>
        {ideas.length > 0 ? (
          <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink-faint">
            {ideas.length === 1 ? "1 idea" : `${ideas.length} ideas`}
          </span>
        ) : null}
      </summary>

      <IdeasBoard tripId={tripId} ideas={ideas} />
    </details>
  );
}

function ChevronGlyph() {
  return (
    <svg
      viewBox="0 0 14 14"
      width={14}
      height={14}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 2.5 10 7l-5 4.5" />
    </svg>
  );
}
