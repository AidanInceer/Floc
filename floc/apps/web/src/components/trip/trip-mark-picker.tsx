/**
 * The grid of marks that sets what a trip is a picture of (#318). One tiny form
 * per mark so it works without JavaScript and posts exactly one value, the same
 * way the colour swatches beside it do.
 *
 * Two rows of five, because that is the set — see `trip-mark.ts` before adding
 * an eleventh. Picking the mark already on the trip clears it, so "no mark" is
 * reachable without a second control saying None.
 */
import { TRIP_MARKS, TRIP_MARK_LABELS, type TripMark } from "@floc/core/trip/mark/trip-mark";
import type { TripColor } from "@floc/core/trip/trip-color";
import { PASTEL_BY_KEY, cx } from "@/components/system/ui";
import { TripMarkIcon } from "@/components/trip/trip-mark";
import { setTripMark } from "@/app/trips/actions";

export function TripMarkPicker({
  tripId,
  current,
  tone,
}: {
  tripId: number;
  current: TripMark | null;
  /** The trip's resolved pastel, so the picked mark wears the trip's own colour. */
  tone: TripColor;
}) {
  return (
    <div className="px-2.5 py-1.5">
      <span className="typed mb-1.5 block">Icon</span>
      <div className="grid grid-cols-5 gap-1.5">
        {TRIP_MARKS.map((mark) => {
          const picked = current === mark;
          return (
            <form key={mark} action={setTripMark}>
              <input type="hidden" name="tripId" value={tripId} />
              <input type="hidden" name="mark" value={picked ? "" : mark} />
              <button
                type="submit"
                aria-label={TRIP_MARK_LABELS[mark]}
                aria-pressed={picked}
                className={cx(
                  "lift grid size-8 place-items-center rounded-md ring-1 ring-inset",
                  picked
                    ? cx(PASTEL_BY_KEY[tone], "ring-current")
                    : "text-ink-2 ring-rule hover:text-ink",
                )}
              >
                <TripMarkIcon mark={mark} size={17} />
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
