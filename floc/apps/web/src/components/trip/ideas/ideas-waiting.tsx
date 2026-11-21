import { nudgeLine, type NudgePerson } from "@floc/core/trip/nudge/nudge";
import { NudgeChips } from "@/components/trip/nudge/nudge-chips";

const PLACE = {
  chips: "max-sm:col-span-2 max-sm:row-start-2",
  end: "max-sm:col-start-2 max-sm:row-start-1",
  note: "col-span-full",
};

export function IdeasWaiting({ tripId, unvoted }: { tripId: number; unvoted: NudgePerson[] }) {
  if (unvoted.length === 0) return null;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3.5 gap-y-1.5 border-t border-rule px-4 py-3 text-sm sm:grid-cols-[max-content_minmax(0,1fr)_auto]">
      <span className="min-w-0 text-ink">{nudgeLine("ideas", unvoted.length)}</span>
      <NudgeChips tripId={tripId} task="ideas" people={unvoted} place={PLACE} />
    </div>
  );
}
