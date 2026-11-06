import { DocumentUpload } from "@/components/documents/document-upload";
import { UploadIcon } from "@/components/system/icons";

const RING = "grid size-6 shrink-0 place-items-center rounded-sm border border-rule-strong bg-sheet text-ink-soft hover:border-pen hover:text-pen";

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
      className={RING}
      trigger={
        <>
          <UploadIcon size={12} />
          <span className="sr-only">{title}</span>
        </>
      }
    />
  );
}
