/**
 * The quiet way in for a booking mail (#559): one shared address, behind one word. It replaces the per-trip
 * address card, which a member had to find for the right trip.
 */
import { CopyLink, Menu } from "@/components/system/client-ui";
import { buttonClass } from "@/components/system/ui";
import { bookingForwardWords } from "@floc/core/documents/booking/booking-inbox";

export function ForwardBookings({ address }: { address: string }) {
  return (
    <Menu
      label="Forward bookings"
      align="right"
      triggerClassName={buttonClass("ghost")}
      trigger="Forward bookings"
      panelClassName="w-[19rem] max-w-[calc(100vw-2rem)] rounded-md border border-rule-strong bg-sheet p-3 shadow-raised"
    >
      <p className="text-sm text-ink">Forward booking emails to</p>
      <p className="mt-0.5 break-all font-mono text-[13px] text-ink">{address}</p>
      <p className="mt-1 text-xs text-ink-soft">{bookingForwardWords}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <CopyLink value={address} label="Copy address" item="Address" variant="secondary" />
        <a role="menuitem" href={`mailto:${address}`} className={buttonClass("ghost")}>
          New email
        </a>
      </div>
    </Menu>
  );
}
