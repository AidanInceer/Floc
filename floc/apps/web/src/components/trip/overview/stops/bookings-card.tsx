// Every file on a stop, one upload control for each, and Whole trip as its own band.
import Link from "next/link";

import type { Leg } from "@floc/core/trip/overview/legs";
import { formatShortRange } from "@floc/core/dates/dates";
import type { TripDocument } from "@/server/documents/documents";
import { DocCategoryIcon } from "@/components/system/icons/doc-category";
import { DocumentUpload } from "@/components/documents/document-upload";
import { UploadIcon } from "@/components/system/icons";
import { cx } from "@/components/system/ui";
import { DOC_CATEGORY_CHIPS } from "@floc/core/documents/documents";
import { StopNo, cityOf } from "./stop-parts";

type Props = {
  tripId: number;
  legs: Leg<TripDocument>[];
  wholeTrip: TripDocument[];
};

const RING =
  "grid size-6 place-items-center rounded-sm border border-rule-strong text-ink-soft hover:border-pen hover:bg-pen-soft hover:text-pen-deep";

// Why: this card is only for uploading bookings; finding a stay lives on Dates and the Days overnight dialog.
export function BookingsCard({ tripId, legs, wholeTrip }: Props) {
  return (
    <aside className="max-lg:order-first lg:sticky lg:top-4">
      <div className="overflow-visible rounded-md border border-rule-strong bg-sheet px-[18px] pt-4">
        <h3 className="typed mb-2.5">Bookings</h3>
        <ul>
          {legs.map((leg) => (
            <StopRow key={leg.no} tripId={tripId} leg={leg} />
          ))}
        </ul>
        <WholeTrip tripId={tripId} files={wholeTrip} />
      </div>
    </aside>
  );
}

function StopRow({ tripId, leg }: { tripId: number; leg: Leg<TripDocument> }) {
  const place = cityOf(leg.placeName);
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)_auto_1.5rem] items-center gap-x-2.5 gap-y-1.5 border-t border-rule py-2.5">
      <a href={`#stop-${leg.no}`} className="group col-span-3 grid grid-cols-subgrid items-center text-ink">
        <StopNo no={leg.no} small />
        <span className="truncate font-medium group-hover:underline">{place}</span>
        <span className="nums whitespace-nowrap text-xs text-ink-faint">{formatShortRange(leg.arrive, leg.leave)}</span>
      </a>
      <Upload tripId={tripId} dayId={leg.days[0].dayId} title={`Add a booking for ${place}`} className={RING} />
      {leg.files.length > 0 ? (
        <div className="col-start-2 col-end-[-1] flex flex-wrap gap-1.5">
          {leg.files.map((f) => (
            <FileChip key={f.id} tripId={tripId} file={f} />
          ))}
        </div>
      ) : null}
    </li>
  );
}

function WholeTrip({ tripId, files }: { tripId: number; files: TripDocument[] }) {
  return (
    <section aria-label="Whole trip" className="-mx-[18px] mt-1 grid gap-2 rounded-b-md border-t border-rule bg-sheet-2 px-[18px] pb-3.5 pt-3">
      <div className="flex items-center justify-between">
        <span className="font-medium">Whole trip</span>
        <Upload tripId={tripId} title="Add a file for the whole trip" className={`${RING} bg-sheet`} />
      </div>
      {files.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {files.map((f) => (
            <FileChip key={f.id} tripId={tripId} file={f} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function Upload({ tripId, dayId, title, className }: { tripId: number; dayId?: number; title: string; className: string }) {
  return (
    <DocumentUpload
      tripId={tripId}
      scope="shared"
      dayId={dayId}
      category={dayId ? "hotel" : "other"}
      title={title}
      bareTrigger
      trigger={
        <>
          <UploadIcon size={12} />
          <span className="sr-only">{title}</span>
        </>
      }
      className={className}
    />
  );
}

function FileChip({ tripId, file }: { tripId: number; file: TripDocument }) {
  return (
    <Link
      href={`/trip/${tripId}/files`}
      title={file.name}
      className={cx("lift inline-flex max-w-[14rem] items-center gap-1.5 rounded-full py-0.5 pl-2 pr-2.5 text-xs", DOC_CATEGORY_CHIPS[file.category])}
    >
      <DocCategoryIcon category={file.category} size={11} />
      <span className="truncate">{file.name}</span>
    </Link>
  );
}
