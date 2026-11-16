import { DocumentUpload } from "@/components/documents/document-upload";
import { UploadIcon } from "@/components/system/icons";
import { menuItemClass } from "@/components/system/ui";

export function HotelUpload({ tripId, dayId, place }: { tripId: number; dayId: number; place: string }) {
  return (
    <DocumentUpload
      tripId={tripId}
      scope="shared"
      dayId={dayId}
      category="hotel"
      title={`Add a booking for ${place}`}
      bareTrigger
      className={menuItemClass}
      trigger={
        <span className="flex items-center gap-2">
          <UploadIcon size={12} />
          Add booking file
        </span>
      }
    />
  );
}
