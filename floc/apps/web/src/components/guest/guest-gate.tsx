/**
 * The first thing somebody on a share link meets (#330, #442): the ask, over the trip.
 *
 * The trip is blurred behind the sheet rather than withheld, so a stranger can
 * see there is something real here. The sheet cannot be dismissed: answering
 * needs a name first, and a name is all it needs. It goes once the visitor is a
 * guest; a member never sees it.
 *
 * Why not `Dialog`: Chrome closes a modal `<dialog>` on a second Escape whatever
 * the page says, which left the trip blurred with no sheet over it.
 */
import type { ReactNode } from "react";

import { Card, cx } from "@/components/system/ui";

export function GuestGate({ tripName, hostName, open, blurb, actions, children }: {
  tripName: string;
  hostName: string | null;
  open: boolean;
  blurb: string;
  /** How this visitor gets in — built on the server, since it holds Server Actions. */
  actions: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center">
          <div role="dialog" aria-modal="true" aria-label={tripName} className="max-h-[90dvh] w-full max-w-md overflow-y-auto">
            <Card className="rounded-b-none bg-sheet sm:rounded-md">
              <div className="grid gap-6 p-6">
                <div>
                  <p className="typed">{hostName ? `${hostName} shared this with you` : "Shared with you"}</p>
                  <h2 className="mt-2 font-display text-2xl font-semibold">{tripName}</h2>
                  <p className="mt-2 text-sm text-ink-soft">{blurb}</p>
                </div>
                {actions}
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {/* aria-hidden with the sheet open: a screen reader is already in it, and the blur is decoration. */}
      <div
        aria-hidden={open || undefined}
        className={cx("transition-[filter] duration-200", open && "pointer-events-none select-none blur-[5px]")}
      >
        {children}
      </div>
    </>
  );
}
