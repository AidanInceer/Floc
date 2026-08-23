/**
 * Everything you do *to a trip*, behind one triple-dot in the header.
 *
 * The same complaint as ticket 125's roster rows, one level up: leaving lived
 * at the foot of Overview inside a "Trip settings" fold, while archive and
 * delete sat in a strip on the hero — three verbs used once a trip, in two
 * places, on one tab out of five. They live here now, beside the roster and the
 * tabs, so they're reachable from any tab and never in the way.
 *
 * Sharing is not here: the roster's own Share trip button is the one place to
 * hand out an invite, and a second copy would be two ways to do it.
 */
import { ConfirmSubmit, Menu, menuDangerItemClass, menuItemClass } from "@/components/client-ui";
import { TripColorPicker } from "@/components/trip-color-picker";
import type { TripColor } from "@/lib/trip-color";
import { archiveTrip, deleteTrip } from "@/app/trips/actions";
import { leaveTrip } from "@/app/trip/[id]/overview/actions";

export function TripMenu({
  tripId,
  tripName,
  isAdmin,
  archived,
  leaveWarning,
  color,
}: {
  tripId: number;
  tripName: string;
  isAdmin: boolean;
  archived: boolean;
  leaveWarning: string;
  color: TripColor | null;
}) {
  return (
    <Menu label="Trip actions">
      {/* The trip's colour — any member, same as rename and tags (ticket 213). */}
      <TripColorPicker tripId={tripId} current={color} />

      {/* Leaving is not an admin power (rule 6), so every member sees it. The
          confirm copy carries whichever consequence applies. */}
      <form action={leaveTrip}>
        <input type="hidden" name="tripId" value={tripId} />
        <ConfirmSubmit
          variant="ghost"
          message={leaveWarning}
          confirmLabel="Leave the trip"
          pendingLabel="…"
          className={menuItemClass}
        >
          Leave trip
        </ConfirmSubmit>
      </form>

      {isAdmin && !archived ? (
        <form action={archiveTrip}>
          {/* One archive action for the whole app (ticket 117); where to land
              afterwards is the caller's. */}
          <input type="hidden" name="tripId" value={tripId} />
          <input type="hidden" name="redirectTo" value="/trips/archived" />
          <ConfirmSubmit
            variant="ghost"
            message={`Archive "${tripName}"? It comes off everyone's list and stays readable — any admin can bring it back from Archived.`}
            confirmLabel="Archive it"
            pendingLabel="…"
            className={menuItemClass}
          >
            Archive trip
          </ConfirmSubmit>
        </form>
      ) : null}

      {isAdmin ? (
        <form action={deleteTrip}>
          <input type="hidden" name="tripId" value={tripId} />
          <input type="hidden" name="redirectTo" value="/trips" />
          <ConfirmSubmit
            variant="ghost"
            message={`Delete "${tripName}" for everyone? Nobody will be able to reopen it from the app — archive it instead if you might want it back.`}
            confirmLabel="Delete it"
            pendingLabel="…"
            className={menuDangerItemClass}
          >
            Delete trip
          </ConfirmSubmit>
        </form>
      ) : null}
    </Menu>
  );
}
