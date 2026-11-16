import { PlusIcon, ShareIcon } from "@/components/system/icons";
import { Sheet } from "@/components/system/client-ui";
import { NextTripForm } from "./next-trip-form";
import { SharePicture } from "./share-picture";

export function RecapFoot({
  tripId,
  tripName,
  others,
}: {
  tripId: number;
  tripName: string;
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
        <Sheet
          title="Plan the next one"
          triggerVariant="secondary"
          triggerClassName="w-full whitespace-nowrap"
          trigger={<><PlusIcon size={12} />Plan the next one</>}
        >
          <NextTripForm tripId={tripId} others={others} />
        </Sheet>
      </div>
    </div>
  );
}
