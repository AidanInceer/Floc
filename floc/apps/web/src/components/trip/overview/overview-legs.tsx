// Why: stops, not days — the Days tab owns the day; here a day is a tick that links there.
import Link from "next/link";

import type { BookingLink } from "@floc/core/trip/booking-links";
import { formatDate } from "@floc/core/dates/dates";
import { hopLabel, type Leg } from "@floc/core/trip/overview/legs";
import type { TripDocument } from "@/server/documents/documents";
import { DocCategoryIcon } from "@/components/documents/doc-category-icon";
import { DocumentUpload } from "@/components/documents/document-upload";
import { Menu } from "@/components/system/client-ui";
import { PASTEL_BY_KEY, cx, menuItemClass } from "@/components/system/ui";
import type { TripColor } from "@floc/core/trip/trip-color";
import { TravelModeIcon } from "@/components/map/travel-mode-icon";
import { dayHref } from "@/lib/trip-links";

type Props = {
  tripId: number;
  legs: Leg<TripDocument>[];
  wholeTrip: TripDocument[];
  /** False when file storage is off (rule 11): no chips, no upload. */
  files: boolean;
  /** Stay search links by place id, for a leg with nothing booked. */
  stays: Map<number, BookingLink[]>;
  tone: TripColor;
};

export function OverviewLegs({ tripId, legs, wholeTrip, files, stays, tone }: Props) {
  if (legs.length === 0) return null;
  return (
    <section aria-labelledby="legs-heading" className="flex flex-col">
      <h2 id="legs-heading" className="mb-3 font-display text-lg">Legs</h2>
      {legs.map((leg) => (
        <div key={leg.days[0].dayId}>
          {leg.no > 1 ? <Hop leg={leg} /> : null}
          <LegRow tripId={tripId} leg={leg} files={files} stays={stays.get(leg.placeId) ?? []} tone={tone} />
        </div>
      ))}
      {files && wholeTrip.length > 0 ? (
        <div className="mt-3.5 grid grid-cols-[9.5rem_1fr] items-center rounded-lg bg-sheet-2 ring-1 ring-rule max-sm:grid-cols-1">
          <span className="typed self-stretch border-r-2 border-dashed border-rule px-5 py-4 max-sm:border-r-0">Whole trip</span>
          <div className="flex flex-wrap gap-1.5 px-5 py-3.5">
            {wholeTrip.map((f) => (
              <FileChip key={f.id} tripId={tripId} file={f} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Hop({ leg }: { leg: Leg<TripDocument> }) {
  return (
    <div className="ml-[3.6rem] flex items-center gap-2 border-l-2 border-dashed border-rule-strong py-2 pl-4 text-xs text-ink-soft">
      <span className="-ml-[1.72rem] grid size-6 place-items-center rounded-full border border-rule-strong bg-paper text-ink-soft">
        {leg.mode ? <TravelModeIcon mode={leg.mode} /> : null}
      </span>
      {hopLabel(leg.mode, leg.placeName)} · <span className="nums">{formatDate(leg.arrive, { weekday: true })}</span>
    </div>
  );
}

function LegRow({
  tripId,
  leg,
  files,
  stays,
  tone,
}: {
  tripId: number;
  leg: Leg<TripDocument>;
  files: boolean;
  stays: BookingLink[];
  tone: TripColor;
}) {
  return (
    <article className="grid grid-cols-[9.5rem_minmax(0,1fr)_minmax(0,1.1fr)] items-center rounded-lg bg-sheet ring-1 ring-rule max-md:grid-cols-[8rem_1fr]">
      <div className="nums grid grid-cols-[auto_1fr] items-center gap-x-3 self-stretch whitespace-nowrap border-r-2 border-dashed border-rule px-5 py-4 text-sm text-ink-soft max-md:gap-x-2 max-md:px-3">
        {/* Same ring and number as the map's pin — one stop drawn twice. */}
        <span aria-hidden="true" className="row-span-2 grid size-6 place-items-center rounded-full border-2 border-pen font-mono text-[11px] font-bold text-pen">
          {leg.no}
        </span>
        <b className="font-medium text-ink">{formatDate(leg.arrive, { weekday: true })}</b>
        <span>{formatDate(leg.leave)}</span>
      </div>

      <div className="flex min-w-0 flex-col gap-1.5 px-5 py-3.5">
        <h3 className="font-display text-lg leading-tight">{leg.placeName}</h3>
        <p className="nums text-sm text-ink-soft">
          {leg.nights} {leg.nights === 1 ? "night" : "nights"}
        </p>
        <div className="flex flex-wrap gap-1">
          {leg.days.map((d) => (
            <Link
              key={d.dayId}
              href={dayHref(tripId, d.date)}
              title={formatDate(d.date)}
              className={cx("nums grid h-6 min-w-[1.6rem] place-items-center rounded-full border border-transparent px-1.5 text-[11px] hover:border-pen", PASTEL_BY_KEY[tone])}
            >
              {Number(d.date.slice(8))}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-1.5 px-5 py-3.5 max-md:col-span-2 max-md:justify-start max-md:border-t max-md:border-rule">
        {files ? leg.files.map((f) => <FileChip key={f.id} tripId={tripId} file={f} />) : null}
        {leg.stay ? null : <NoStay tripId={tripId} leg={leg} files={files} stays={stays} />}
      </div>
    </article>
  );
}

// What is missing gets the words (house rule): the stay, and where to add it.
function NoStay({
  tripId,
  leg,
  files,
  stays,
}: {
  tripId: number;
  leg: Leg<TripDocument>;
  files: boolean;
  stays: BookingLink[];
}) {
  return (
    <span className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 max-md:justify-start">
      {files ? (
        <DocumentUpload
          tripId={tripId}
          scope="shared"
          dayId={leg.days[0].dayId}
          category="stay"
          title={`Upload the stay booking for ${leg.placeName}`}
          bareTrigger
          trigger={
            <>
              <UploadIcon />
              Upload booking
            </>
          }
          className="inline-flex items-center gap-1.5 rounded-full bg-sheet-2 px-3 py-1 text-sm text-ink ring-1 ring-rule hover:ring-pen"
        />
      ) : null}
      {stays.length > 0 ? (
        <Menu
          label={`Find a stay in ${leg.placeName}`}
          trigger={
            <>
              <SearchIcon />
              Find
            </>
          }
          triggerClassName="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm text-ink-soft hover:bg-sheet-2 hover:text-ink data-[open=true]:bg-sheet-2"
        >
          {stays.map((l) => (
            <a key={l.site} href={l.url} target="_blank" rel="noopener noreferrer" className={menuItemClass}>
              {l.site}
              <span className="sr-only"> (opens another site)</span>
            </a>
          ))}
        </Menu>
      ) : null}
    </span>
  );
}

function FileChip({ tripId, file }: { tripId: number; file: TripDocument }) {
  return (
    <Link
      href={`/trip/${tripId}/files`}
      title={file.name}
      className="lift inline-flex max-w-[16rem] items-center gap-1.5 rounded-full border border-pastel-red-edge bg-pastel-red py-1 pl-2.5 pr-3 text-sm text-pastel-red-ink"
    >
      <DocCategoryIcon category={file.category} />
      <span className="truncate">{file.name}</span>
    </Link>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 14 14" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 9.5V2.5M4.2 5.2L7 2.5l2.8 2.7M2.5 9.5v2h9v-2" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 14 14" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" aria-hidden="true">
      <circle cx="6" cy="6" r="3.6" />
      <path d="M8.7 8.7l2.8 2.8" />
    </svg>
  );
}
