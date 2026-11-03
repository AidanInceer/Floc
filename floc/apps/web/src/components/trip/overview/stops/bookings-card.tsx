// Every file on a stop, one upload control for each, and Whole trip as its own band.
import Link from "next/link";
import type { ReactNode } from "react";

import type { BookingLink } from "@floc/core/trip/booking-links";
import type { Leg } from "@floc/core/trip/overview/legs";
import { formatShortRange } from "@floc/core/dates/dates";
import type { TripDocument } from "@/server/documents/documents";
import { DocCategoryIcon } from "@/components/system/icons/doc-category";
import { DocumentUpload } from "@/components/documents/document-upload";
import { Menu } from "@/components/system/client-ui";
import { OutIcon, UploadIcon } from "@/components/system/icons";
import { menuItemClass } from "@/components/system/ui";
import { StopNo, cityOf } from "./stop-parts";

type Props = {
  tripId: number;
  legs: Leg<TripDocument>[];
  wholeTrip: TripDocument[];
  files: boolean;
  stays: Map<number, BookingLink[]>;
};

const RING =
  "grid size-6 place-items-center rounded-sm border border-rule-strong text-ink-soft hover:border-pen hover:text-pen data-[open=true]:border-pen data-[open=true]:text-pen";

export function BookingsCard({ tripId, legs, wholeTrip, files, stays }: Props) {
  return (
    <aside className="max-lg:order-first lg:sticky lg:top-4">
      <div className="overflow-visible rounded-md border border-rule-strong bg-sheet px-[18px] pt-4">
        <h3 className="typed mb-2.5">Bookings</h3>
        <ul className={files ? undefined : "pb-1.5"}>
          {legs.map((leg) => (
            <StopRow key={leg.no} tripId={tripId} leg={leg} files={files} links={leg.stay ? [] : (stays.get(leg.placeId) ?? [])} />
          ))}
        </ul>
        {files ? <WholeTrip tripId={tripId} files={wholeTrip} /> : null}
      </div>
    </aside>
  );
}

function StopRow({ tripId, leg, files, links }: { tripId: number; leg: Leg<TripDocument>; files: boolean; links: BookingLink[] }) {
  const place = cityOf(leg.placeName);
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)_auto_1.5rem] items-center gap-x-2.5 gap-y-1.5 border-t border-rule py-2.5">
      <a href={`#stop-${leg.no}`} className="group col-span-3 grid grid-cols-subgrid items-center text-ink">
        <StopNo no={leg.no} small />
        <span className="truncate font-medium group-hover:underline">{place}</span>
        <span className="nums whitespace-nowrap text-xs text-ink-faint">{formatShortRange(leg.arrive, leg.leave)}</span>
      </a>
      <StopAction tripId={tripId} dayId={leg.days[0].dayId} place={place} files={files} links={links} />
      {files && leg.files.length > 0 ? (
        <div className="col-start-2 col-end-[-1] flex flex-wrap gap-1.5">
          {leg.files.map((f) => (
            <FileChip key={f.id} tripId={tripId} file={f} />
          ))}
        </div>
      ) : null}
    </li>
  );
}

// One control a stop: straight to the upload when that is all there is to do, a menu when there is a stay to find too.
function StopAction({ tripId, dayId, place, files, links }: { tripId: number; dayId: number; place: string; files: boolean; links: BookingLink[] }) {
  const title = `Add a booking for ${place}`;
  if (links.length === 0) {
    return files ? <Upload tripId={tripId} dayId={dayId} title={title} className={RING} trigger={<UploadIcon size={12} />} /> : <span />;
  }
  return (
    <Menu label={files ? title : `Find a stay in ${place}`} trigger={files ? <UploadIcon size={12} /> : <OutIcon size={11} />} triggerClassName={RING}>
      {files ? (
        <Upload
          tripId={tripId}
          dayId={dayId}
          title={title}
          className={menuItemClass}
          named
          trigger={
            <span className="inline-flex items-center gap-2.5">
              <UploadIcon size={12} />
              Upload a booking
            </span>
          }
        />
      ) : null}
      <p className={files ? "mt-1 border-t border-rule px-2.5 pb-0.5 pt-2 text-xs text-ink-faint" : "px-2.5 pb-0.5 pt-1 text-xs text-ink-faint"}>Find a stay</p>
      {links.map((l) => (
        <a key={l.site} href={l.url} target="_blank" rel="noopener noreferrer" className={menuItemClass}>
          <span className="inline-flex items-center gap-2.5">
            <OutIcon size={11} />
            {l.site}
          </span>
          <span className="sr-only"> (opens another site)</span>
        </a>
      ))}
    </Menu>
  );
}

function WholeTrip({ tripId, files }: { tripId: number; files: TripDocument[] }) {
  return (
    <section aria-label="Whole trip" className="-mx-[18px] mt-1 grid gap-2 rounded-b-md border-t border-rule bg-sheet-2 px-[18px] pb-3.5 pt-3">
      <div className="flex items-center justify-between">
        <span className="font-medium">Whole trip</span>
        <Upload tripId={tripId} title="Add a file for the whole trip" className={`${RING} bg-sheet`} trigger={<UploadIcon size={12} />} />
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

function Upload({ tripId, dayId, title, className, trigger, named }: { tripId: number; dayId?: number; title: string; className: string; trigger: ReactNode; named?: boolean }) {
  return (
    <DocumentUpload
      tripId={tripId}
      scope="shared"
      dayId={dayId}
      category={dayId ? "stay" : "other"}
      title={title}
      bareTrigger
      trigger={
        <>
          {trigger}
          {named ? null : <span className="sr-only">{title}</span>}
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
      className="lift inline-flex max-w-[14rem] items-center gap-1.5 rounded-full border border-pastel-red-edge bg-pastel-red py-0.5 pl-2 pr-2.5 text-xs text-pastel-red-ink"
    >
      <DocCategoryIcon category={file.category} size={11} />
      <span className="truncate">{file.name}</span>
    </Link>
  );
}
