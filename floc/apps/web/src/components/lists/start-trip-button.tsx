import Link from "next/link";

import { Glyph } from "@/components/system/icons/landing";
import { savedStartHref, type SavedThing } from "@/lib/landing/start-trip";

const startClass =
  "-mr-2 inline-flex h-8 shrink-0 items-center gap-1.5 rounded-sm px-2 text-[13px] font-medium text-pen transition-colors hover:bg-pen-soft hover:text-pen-deep max-sm:w-8 max-sm:justify-center max-sm:px-0";

export function StartTripButton({ saved, name, href }: { saved?: SavedThing; name: string; href?: string }) {
  return (
    <Link href={href ?? (saved ? savedStartHref(saved) : "/trips?new=")} aria-label={`Start trip from ${name}`} className={startClass}>
      <span className="max-sm:sr-only">Start trip</span>
      <Glyph name="arrow" />
    </Link>
  );
}
