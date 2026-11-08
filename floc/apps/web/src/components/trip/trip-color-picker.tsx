/**
 * The row of pastel swatches that sets a trip's colour (ticket 213). One tiny
 * form per swatch so it works without JavaScript and posts exactly one value;
 * the picked one carries the pen ring. Lives inside the trip menus, on the card and
 * in the header, so both change the colour the same way. Square and centred, the
 * size of the mark tiles below, with no heading: the swatches say what they are.
 */
import { TRIP_COLORS, type TripColor } from "@floc/core/trip/trip-color";
import { PASTEL_BY_KEY, PickOption, cx } from "@/components/system/ui";
import { setTripColor } from "@/app/trips/actions";

export function TripColorPicker({
  tripId,
  current,
}: {
  tripId: number;
  current: TripColor | null;
}) {
  return (
    <div className="px-2.5 py-1.5">
      <div className="flex items-center justify-center gap-1.5">
        {TRIP_COLORS.map((color) => {
          const picked = current === color;
          return (
            <form key={color} action={setTripColor}>
              <input type="hidden" name="tripId" value={tripId} />
              <input type="hidden" name="color" value={color} />
              <PickOption
                type="submit"
                label={color}
                picked={picked}
                className={cx("size-8 rounded-sm ring-1 ring-inset ring-ink/10", PASTEL_BY_KEY[color])}
              />
            </form>
          );
        })}
      </div>
    </div>
  );
}
