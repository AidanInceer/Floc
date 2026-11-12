"use client";

/**
 * Asks which trip each waiting booking is for, once a visit (#559). Dismissing it keeps the files: they stay
 * in Bookings. Why session storage: the answer "not now" is about this visit, not a fact about the account.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { WaitingFileRow } from "@/components/bookings/waiting-file-row";
import type { TripChoice, WaitingFile } from "@floc/core/documents/booking/booking-inbox";
import { Card } from "@/components/system/ui";

const ASKED = "floc.bookings.asked";

export function WhichTripPrompt({ files, trips }: { files: WaitingFile[]; trips: TripChoice[] }) {
  const ref = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const newest = Math.max(0, ...files.map((file) => file.id));
  const onBookings = pathname === "/bookings";

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || dialog.open || onBookings || files.length === 0) return;
    // Why the newest id: a file that arrives later in the visit asks again; the same files do not.
    if (Number(window.sessionStorage.getItem(ASKED) ?? 0) >= newest) return;
    dialog.showModal();
  }, [files.length, newest, onBookings]);

  useEffect(() => {
    if (files.length === 0 || onBookings) ref.current?.close();
  }, [files.length, onBookings]);

  const dismiss = () => {
    window.sessionStorage.setItem(ASKED, String(newest));
    ref.current?.close();
  };

  if (files.length === 0) return null;
  return (
    <dialog
      ref={ref}
      aria-labelledby="which-trip-title"
      onClose={() => window.sessionStorage.setItem(ASKED, String(newest))}
      onClick={(event) => { if (event.target === event.currentTarget) dismiss(); }}
      className="m-0 max-h-[90dvh] w-full max-w-lg overflow-hidden bg-transparent p-0 backdrop:bg-black/40 sm:m-auto"
      style={{ marginTop: "auto" }}
    >
      <Card className="flex max-h-[90dvh] flex-col overflow-hidden rounded-b-none bg-sheet sm:rounded-md">
        <div className="flex items-center justify-between border-b border-dotted border-rule-strong px-4 py-3">
          <h2 id="which-trip-title" className="font-display text-base font-semibold">
            {/* Why: with one trip there is nothing to ask, so the title names it and each row only says Add. */}
            {trips.length === 1 ? `Add to ${trips[0].name}?` : "Which trip is this for?"}
          </h2>
          <button type="button" onClick={dismiss} aria-label="Close" className="rounded-sm px-2 text-lg leading-none text-ink-faint hover:text-ink">
            ×
          </button>
        </div>
        <ul className="scroll-thin min-h-0 flex-1 divide-y divide-rule overflow-y-auto">
          {files.map((file) => (
            <WaitingFileRow key={file.id} file={file} trips={trips} oneTripLabel="Add" />
          ))}
        </ul>
        <footer className="flex items-center justify-between gap-3 border-t border-rule bg-sheet-2 px-4 py-3">
          <Link href="/bookings" onClick={dismiss} className="text-xs text-pen hover:text-pen-deep">
            Open Bookings
          </Link>
          <button type="button" onClick={dismiss} className="text-xs text-ink-soft hover:text-pen-deep">
            Not now
          </button>
        </footer>
      </Card>
    </dialog>
  );
}
