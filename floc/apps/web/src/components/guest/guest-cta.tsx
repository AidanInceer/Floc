/**
 * The bar above every page of a share link (#330). Sits at the top rather than
 * the foot because it is the one thing on a guest's screen that is not
 * read-only, and somebody who dismissed `GuestGate` has nothing else to act on.
 *
 * Says what a guest cannot do here, not what they can — that is the drawing's
 * job (rule 11).
 */
import type { ReactNode } from "react";

export function GuestCta({ controls }: { controls: ReactNode }) {
  return (
    <div className="border-b border-rule bg-pastel-blue">
      {/* Stacks on a phone: side by side, the sentence was squeezed into a
          six-line column beside the buttons. */}
      <div className="mx-auto flex w-full max-w-[84rem] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-6">
        <p className="min-w-0 text-sm text-pastel-blue-ink sm:flex-1">
          You are viewing this trip, not on it. Joining, adding anything, or
          opening a file needs an account.
        </p>
        {controls}
      </div>
    </div>
  );
}
