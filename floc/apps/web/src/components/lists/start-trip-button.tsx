import { Glyph } from "@/components/system/icons/landing";
import { ButtonLink } from "@/components/system/ui";
import { savedStartHref, type SavedThing } from "@/lib/landing/start-trip";

/** The bottom-right of a Saved tile: start a trip from it at once (#467). */
export function StartTripButton({ saved, name }: { saved: SavedThing; name: string }) {
  return (
    <div className="flex justify-end">
      <ButtonLink href={savedStartHref(saved)} aria-label={`Start trip from ${name}`}>
        Start trip <Glyph name="arrow" />
      </ButtonLink>
    </div>
  );
}
