import { ShareIcon } from "@/components/system/icons";
import { Sheet } from "@/components/system/client-ui";
import { PlanNext } from "./plan-next";
import { SharePicture } from "./share-picture";

export function RecapFoot({
  tripId,
  tripName,
  me,
  others,
}: {
  tripId: number;
  tripName: string;
  me: string;
  others: { id: string; name: string }[];
}) {
  return (
    <div data-recap>
      <div className="grid grid-cols-[auto_1fr] gap-2 py-3">
        <Sheet
          title={`Share ${tripName}`}
          triggerVariant="secondary"
          triggerClassName="w-full whitespace-nowrap"
          trigger={<><ShareIcon size={12} />Share</>}
        >
          <SharePicture tripId={tripId} tripName={tripName} />
        </Sheet>
        <PlanNext me={me} others={others} />
      </div>
    </div>
  );
}
