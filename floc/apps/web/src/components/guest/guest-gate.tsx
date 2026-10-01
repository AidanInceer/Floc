"use client";

/**
 * The first thing somebody on a share link meets (#330): the ask, over the trip.
 *
 * The trip is blurred behind the dialog rather than withheld — a stranger
 * should be able to see there is something real here before deciding to sign
 * up. Dismissing clears the blur for good and leaves the read-only trip; the
 * ask does not come back, because a dialog that reopens is a wall with extra
 * steps. The bar above every page keeps it reachable.
 */
import { useState } from "react";
import type { ReactNode } from "react";

import { Dialog } from "@/components/system/dialog";
import { Button, Card, cx } from "@/components/system/ui";

export function GuestGate({
  tripName,
  hostName,
  controls,
  children,
}: {
  tripName: string;
  hostName: string | null;
  /** How this visitor gets in — built on the server, since it holds a Server Action. */
  controls: ReactNode;
  children: ReactNode;
}) {
  const [asking, setAsking] = useState(true);
  const dismiss = () => setAsking(false);

  return (
    <>
      <Dialog
        open={asking}
        onClose={dismiss}
        title={tripName}
        className="m-0 mt-auto max-h-[90dvh] w-full max-w-md overflow-y-auto bg-transparent p-0 backdrop:bg-black/40 sm:m-auto"
      >
        <Card className="rounded-b-none bg-sheet sm:rounded-sm">
          <div className="p-6">
            <p className="typed">
              {hostName ? `${hostName} shared this with you` : "Shared with you"}
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold">
              {tripName}
            </h2>
            <p className="mt-3 text-sm text-ink-soft">
              You are looking at a read-only copy. Join to plan with the group,
              add days, and open the files.
            </p>

            <div className="mt-6">{controls}</div>

            <Button variant="ghost" className="mt-4 px-0" onClick={dismiss}>
              Just have a look first
            </Button>
          </div>
        </Card>
      </Dialog>

      {/* aria-hidden with the dialog open: a screen reader is already in the
          dialog, and the blur is decoration it cannot act on anyway. */}
      <div
        aria-hidden={asking || undefined}
        className={cx(
          "transition-[filter] duration-200",
          asking && "pointer-events-none select-none blur-[5px]",
        )}
      >
        {children}
      </div>
    </>
  );
}
