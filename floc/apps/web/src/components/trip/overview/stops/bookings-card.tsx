// Every file on a stop, an upload for another, and a way out to find a stay.
import Link from "next/link";

import type { BookingLink } from "@floc/core/trip/booking-links";
import type { Leg } from "@floc/core/trip/overview/legs";
import type { TripDocument } from "@/server/documents/documents";
import { DocCategoryIcon } from "@/components/documents/doc-category-icon";
import { DocumentUpload } from "@/components/documents/document-upload";
import { Menu } from "@/components/system/client-ui";
import { OutIcon, UploadIcon } from "@/components/system/icons";
import { menuItemClass } from "@/components/system/ui";
import { StopNo, cityOf, stopDates } from "./stop-parts";

type Props = {
  tripId: number;
  legs: Leg<TripDocument>[];
  wholeTrip: TripDocument[];
  files: boolean;
  stays: Map<number, BookingLink[]>;
};

export function BookingsCard({ tripId, legs, wholeTrip, files, stays }: Props) {
  return (
    <aside className="max-lg:order-first lg:sticky lg:top-4">
      <div className="rounded-md border border-rule-strong bg-sheet px-[18px] pb-1.5 pt-4">
        <h3 className="typed mb-2.5">Bookings</h3>
        {legs.map((leg) => (
          <div key={leg.no} className="grid gap-2 border-t border-rule py-3">
            <a href={`#stop-${leg.no}`} className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 text-ink">
              <StopNo no={leg.no} small />
              <span className="truncate font-medium group-hover:underline">{cityOf(leg.placeName)}</span>
              <span className="nums text-xs text-ink-faint">{stopDates(leg)}</span>
            </a>
            <div className="flex flex-wrap items-center gap-1.5 pl-8">
              {files ? leg.files.map((f) => <FileChip key={f.id} tripId={tripId} file={f} />) : null}
              {files ? <AddFile tripId={tripId} dayId={leg.days[0].dayId} place={cityOf(leg.placeName)} /> : null}
              {leg.stay ? null : <FindStay place={cityOf(leg.placeName)} links={stays.get(leg.placeId) ?? []} />}
            </div>
          </div>
        ))}
        {files ? (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-rule py-3">
            <span className="typed mr-1">Whole trip</span>
            {wholeTrip.map((f) => (
              <FileChip key={f.id} tripId={tripId} file={f} />
            ))}
            <AddFile tripId={tripId} />
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function FileChip({ tripId, file }: { tripId: number; file: TripDocument }) {
  return (
    <Link
      href={`/trip/${tripId}/files`}
      title={file.name}
      className="lift inline-flex max-w-[14rem] items-center gap-1.5 rounded-full border border-pastel-red-edge bg-pastel-red py-0.5 pl-2 pr-2.5 text-xs text-pastel-red-ink"
    >
      <DocCategoryIcon category={file.category} size={11} />
      <span className="truncate">{file.name}</span>
    </Link>
  );
}

function AddFile({ tripId, dayId, place }: { tripId: number; dayId?: number; place?: string }) {
  const title = place ? `Add a booking for ${place}` : "Add a file for the whole trip";
  return (
    <DocumentUpload
      tripId={tripId}
      scope="shared"
      dayId={dayId}
      category={place ? "stay" : "other"}
      title={title}
      bareTrigger
      trigger={
        <>
          <UploadIcon size={12} />
          <span className="sr-only">{title}</span>
        </>
      }
      className="grid size-6 place-items-center rounded-full border border-dashed border-rule-strong text-ink-soft hover:border-solid hover:border-pen hover:text-pen"
    />
  );
}

function FindStay({ place, links }: { place: string; links: BookingLink[] }) {
  if (links.length === 0) return null;
  return (
    <Menu
      label={`Find a stay in ${place}`}
      align="left"
      trigger={<OutIcon size={11} />}
      triggerClassName="grid size-6 place-items-center rounded-full border border-dashed border-rule-strong text-ink-soft hover:border-solid hover:border-pen hover:text-pen data-[open=true]:bg-sheet-2"
    >
      {links.map((l) => (
        <a key={l.site} href={l.url} target="_blank" rel="noopener noreferrer" className={menuItemClass}>
          {l.site}
          <span className="sr-only"> (opens another site)</span>
        </a>
      ))}
    </Menu>
  );
}
