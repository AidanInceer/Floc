import Link from "next/link";

import { Glyph } from "@/components/system/icons/landing";
import { savedStartHref, type SavedThing } from "@/lib/landing/start-trip";

// Why: Aidan's A3 pick (#467) — a quiet pen word on the tile's last line, not the house button's mono capitals; a phone keeps the arrow.
const startClass =
  "-mr-2 inline-flex h-8 shrink-0 items-center gap-1.5 rounded-sm px-2 text-[13px] font-medium text-pen transition-colors hover:bg-pen-soft hover:text-pen-deep max-sm:w-8 max-sm:justify-center max-sm:px-0";

/** Start a trip from a Saved tile at once: the right end of its last line. */
export function StartTripButton({ saved, name }: { saved: SavedThing; name: string }) {
  return (
    <Link href={savedStartHref(saved)} aria-label={`Start trip from ${name}`} className={startClass}>
      <span className="max-sm:sr-only">Start trip</span>
      <Glyph name="arrow" />
    </Link>
  );
}
