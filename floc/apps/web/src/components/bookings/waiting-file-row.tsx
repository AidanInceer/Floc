"use client";

/** One file waiting for a trip (#559): what it is, and the one thing to do with it — choose its trip. */
import type { ReactNode } from "react";

import { placeBooking } from "@/app/bookings/actions";
import { KindChip } from "@/components/documents/document-row";
import { ActionForm, SubmitButton } from "@/components/system/client-ui";
import { Select } from "@/components/system/ui";
import { bookingSummary } from "@floc/core/documents/booking/booking-details";
import { bookingInboxLeftWords, type TripChoice, type WaitingFile } from "@floc/core/documents/booking/booking-inbox";
import { formatBytes } from "@floc/core/documents/documents";

type Props = {
  file: WaitingFile;
  trips: TripChoice[];
  /** The button's words when there is one trip. The dialog's title already names the trip, so it says less there. */
  oneTripLabel?: string;
  children?: ReactNode;
};

export function WaitingFileRow({ file, trips, oneTripLabel = "Add to trip", children }: Props) {
  const only = trips.length === 1 ? trips[0] : null;
  return (
    <li className="flex items-start gap-2.5 px-3 py-2.5">
      <span className="flex h-9 items-center">
        <KindChip mimeType={file.mimeType} />
      </span>
      {/* Why one column after the chip: when the action drops to its own line it keeps the name's left edge. */}
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex min-w-0 flex-1 basis-56 flex-col leading-snug">
          <span className="truncate text-sm font-medium text-ink">{file.name}</span>
          <span className="nums text-xs text-ink-soft">
            {file.booking ? <>{bookingSummary(file.booking)} &middot; </> : null}
            {formatBytes(file.sizeBytes)} &middot; {bookingInboxLeftWords(file.daysLeft)}
          </span>
        </div>
        {trips.length === 0 ? (
          <span className="text-xs text-ink-soft">No trip to put it in yet</span>
        ) : (
          <ActionForm action={placeBooking.bind(null, file.id)} className="flex min-w-0 flex-wrap items-center gap-1.5" errorClassName="basis-full">
            {only ? (
              <input type="hidden" name="tripId" value={only.id} />
            ) : (
              <Select name="tripId" required defaultValue="" aria-label={`Trip for ${file.name}`} className="w-44 max-w-full">
                <option value="" />
                {trips.map((trip) => (
                  <option key={trip.id} value={trip.id}>
                    {trip.name}
                  </option>
                ))}
              </Select>
            )}
            <SubmitButton variant="secondary" className="whitespace-nowrap">
              {only ? oneTripLabel : "Add"}
            </SubmitButton>
          </ActionForm>
        )}
      </div>
      {children ? <span className="flex h-9 items-center">{children}</span> : null}
    </li>
  );
}
