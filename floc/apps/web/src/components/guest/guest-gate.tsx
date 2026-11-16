import type { ReactNode } from "react";

import { Card, cx } from "@/components/system/ui";

export function GuestGate({ tripName, hostName, open, blurb, actions, children }: {
  tripName: string;
  hostName: string | null;
  open: boolean;
  blurb: string;
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
                  <h2 className="font-display text-2xl font-semibold">{tripName}</h2>
                  <p className="mt-2 text-sm text-ink-soft">
                    {hostName ? `${hostName} shared this with you. ` : null}
                    {blurb}
                  </p>
                </div>
                {actions}
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      <div
        aria-hidden={open || undefined}
        className={cx("transition-[filter] duration-200", open && "pointer-events-none select-none blur-[5px]")}
      >
        {children}
      </div>
    </>
  );
}
