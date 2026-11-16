"use client";

import { useState, type ReactNode } from "react";

import { placeBooking } from "@/app/bookings/actions";
import { KindChip } from "@/components/documents/document-row";
import { Menu } from "@/components/system/client-ui";
import { ErrorText, buttonClass, cx, menuItemClass } from "@/components/system/ui";
import { bookingSummary } from "@floc/core/documents/booking/booking-details";
import { bookingInboxLeftWords, type TripChoice, type WaitingFile } from "@floc/core/documents/booking/booking-inbox";
import { formatBytes } from "@floc/core/documents/documents";

export function WaitingFileRow({ file, trips, children }: { file: WaitingFile; trips: TripChoice[]; children?: ReactNode }) {
  const [refusal, setRefusal] = useState<string | null>(null);
  const place = async (formData: FormData) => {
    const answer = await placeBooking(file.id, formData);
    setRefusal(answer?.error ?? null);
  };

  return (
    <li className="flex items-start gap-2.5 px-3 py-2.5">
      <span className="flex h-9 items-center">
        <KindChip mimeType={file.mimeType} />
      </span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex min-w-0 flex-1 basis-56 flex-col leading-snug">
          <span className="truncate text-sm font-medium text-ink">{file.name}</span>
          <span className="nums text-xs text-ink-soft">
            {file.booking ? <>{bookingSummary(file.booking)} &middot; </> : null}
            {formatBytes(file.sizeBytes)} &middot; {bookingInboxLeftWords(file.daysLeft)}
          </span>
          <ErrorText>{refusal}</ErrorText>
        </div>
        {trips.length === 0 ? (
          <span className="text-xs text-ink-soft">No trip to put it in yet</span>
        ) : (
          <TripMenu fileName={file.name} trips={trips} place={place} />
        )}
      </div>
      {children ? <span className="flex h-9 items-center">{children}</span> : null}
    </li>
  );
}

function TripMenu({ fileName, trips, place }: { fileName: string; trips: TripChoice[]; place: (formData: FormData) => Promise<void> }) {
  return (
    <Menu
      label={`Add ${fileName} to a trip`}
      trigger="Add to trip"
      triggerClassName={cx(buttonClass("secondary"), "whitespace-nowrap")}
      panelClassName="!right-full !top-0 !mt-0 mr-2 max-h-64 w-max min-w-[10rem] max-w-[16rem] overflow-y-auto rounded-md border border-rule-strong bg-sheet p-1 shadow-raised"
    >
      <form action={place}>
        {trips.map((trip) => (
          <button key={trip.id} type="submit" role="menuitem" name="tripId" value={trip.id} className={menuItemClass}>
            {trip.name}
          </button>
        ))}
      </form>
    </Menu>
  );
}
