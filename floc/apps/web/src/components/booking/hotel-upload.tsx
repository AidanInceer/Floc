import { DocumentUpload } from "@/components/documents/document-upload";
import { UploadIcon } from "@/components/system/icons";
import { iconFrameClass } from "@/components/system/ui";

/** Files a booking as Hotel on the stop's first day, from the Dates row. */
export function HotelUpload({ tripId, dayId, place }: { tripId: number; dayId: number; place: string }) {
  const title = `Add a booking for ${place}`;
  return (
    <DocumentUpload
      tripId={tripId}
      scope="shared"
      dayId={dayId}
      category="hotel"
      title={title}
      bareTrigger
      className={iconFrameClass()}
      trigger={
        <>
          <UploadIcon />
          <span className="sr-only">{title}</span>
        </>
      }
    />
  );
}
