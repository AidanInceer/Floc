import type { Gap, GapNudge } from "@floc/core/trip/overview/left-to-sort";
import { NudgeChips } from "@/components/trip/nudge/nudge-chips";
import { SortTile } from "./sort-card";

const PLACE = {
  chips: "max-sm:col-span-2 max-sm:col-start-2 max-sm:row-start-2 sm:col-start-3 sm:col-end-6",
  end: "max-sm:col-start-3 max-sm:row-start-1 sm:col-start-6",
  note: "col-span-full max-sm:col-start-2",
};

export function NudgeCard({ tripId, gap, nudge }: { tripId: number; gap: Gap; nudge: GapNudge }) {
  return (
    <li className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-x-3.5 gap-y-1.5 rounded-md bg-sheet px-3.5 py-2.5 text-sm ring-1 ring-rule sm:col-span-full sm:grid-cols-subgrid">
      <SortTile kind={gap.kind} />
      <span className="min-w-0">{nudge.line}</span>
      <NudgeChips tripId={tripId} task={nudge.task} people={nudge.people} place={PLACE} />
    </li>
  );
}
