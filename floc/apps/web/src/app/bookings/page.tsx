/**
 * Your Bookings area (#559, ADR-050): forwarded or uploaded files that wait for you to choose their trip.
 * Yours alone; a file reaches a trip only as one of your private files there.
 */
import { removeBooking } from "./actions";
import { requireUser } from "@/server/access";
import { canUseFeature } from "@/server/billing/entitlements";
import { bookingInboxUsage, tripsForPlacing, waitingBookings } from "@/server/documents/bookings/booking-inbox";
import { documentsEnabled } from "@/server/documents/document-store";
import { bookingsInboxAddress } from "@/server/documents/inbound/inbound-address";
import { AccountPage, Panel } from "@/components/auth/account-ui";
import { AccountTabs } from "@/components/chrome/account-tabs";
import { BookingUpload } from "@/components/bookings/booking-upload";
import { WaitingFileRow } from "@/components/bookings/waiting-file-row";
import { StorageMeter } from "@/components/documents/storage-meter";
import { CopyLink, Menu } from "@/components/system/client-ui";
import { EmptyState, menuItemClass } from "@/components/system/ui";
import {
  bookingForwardWords, bookingInboxNote, bookingsEmptyWords, bookingsNoStorageWords,
} from "@floc/core/documents/booking/booking-inbox";

export const metadata = { title: "Bookings" };

export default async function BookingsPage() {
  const viewer = await requireUser("/bookings");
  const enabled = documentsEnabled();
  const [files, trips, usage, reads] = await Promise.all([
    waitingBookings(viewer.id),
    tripsForPlacing(viewer.id),
    bookingInboxUsage(viewer.id),
    canUseFeature("bookings.autoFile", viewer.id),
  ]);
  const address = bookingsInboxAddress();
  const choices = trips.map((trip) => ({ id: trip.id, name: trip.name }));

  return (
    <>
    <AccountTabs current="bookings" userId={viewer.id} />
    <AccountPage title="Bookings" titleInBar>
      {enabled ? <div className="flex justify-end"><BookingUpload /></div> : null}
      {!enabled ? (
        <EmptyState title={bookingsNoStorageWords} />
      ) : (
        <>
          {address ? (
            <Panel>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <div className="min-w-0 flex-1 basis-56">
                  <p className="text-sm text-ink">Forward a booking email to</p>
                  <p className="mt-0.5 break-all font-mono text-[13px] text-ink">{address}</p>
                  <p className="mt-1 text-xs text-ink-soft">
                    {bookingForwardWords} {reads ? "Floc puts it on the trip its dates match." : "With Pro, Floc puts it on the trip its dates match."}
                  </p>
                </div>
                <CopyLink value={address} label="Copy address" item="Address" variant="secondary" />
              </div>
            </Panel>
          ) : null}

          {files.length === 0 ? (
            <EmptyState title={bookingsEmptyWords} />
          ) : (
            <Panel>
              <ul className="-mx-3 -my-2.5 divide-y divide-rule">
                {files.map((file) => (
                  <WaitingFileRow
                    key={file.id}
                    file={{ id: file.id, name: file.name, mimeType: file.mimeType, sizeBytes: file.sizeBytes, booking: reads ? file.details : null, daysLeft: file.daysLeft }}
                    trips={choices}
                  >
                    <Menu label={`More for ${file.name}`}>
                      <form action={removeBooking.bind(null, file.id)}>
                        <button type="submit" role="menuitem" className={menuItemClass}>
                          Remove
                        </button>
                      </form>
                    </Menu>
                  </WaitingFileRow>
                ))}
              </ul>
            </Panel>
          )}

          <div className="flex flex-wrap items-center justify-between gap-x-4">
            <p className="mt-6 text-xs text-ink-soft">{bookingInboxNote}</p>
            <StorageMeter {...usage} />
          </div>
        </>
      )}
    </AccountPage>
    </>
  );
}
