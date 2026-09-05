/**
 * The row of pastel swatches that sets a trip's colour (ticket 213). One tiny
 * form per swatch so it works without JavaScript and posts exactly one value;
 * the picked one carries a ring. Lives inside the trip menus, on the card and
 * in the header, so both change the colour the same way.
 */
import { TRIP_COLORS, type TripColor } from "@floc/core/trip-color";
import { PASTEL_BY_KEY, cx } from "@/components/ui";
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
      <span className="typed mb-1.5 block">Colour</span>
      <div className="flex items-center gap-2">
        {TRIP_COLORS.map((color) => {
          const picked = current === color;
          return (
            <form key={color} action={setTripColor}>
              <input type="hidden" name="tripId" value={tripId} />
              <input type="hidden" name="color" value={color} />
              <button
                type="submit"
                aria-label={color}
                aria-pressed={picked}
                className={cx(
                  "lift size-6 rounded-full ring-1 ring-inset ring-ink/10",
                  PASTEL_BY_KEY[color],
                  picked && "outline outline-2 outline-offset-2 outline-ink",
                )}
              />
            </form>
          );
        })}
      </div>
    </div>
  );
}
