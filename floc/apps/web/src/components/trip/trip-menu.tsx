import { ConfirmSubmit, Menu } from "@/components/system/client-ui";
import { CogIcon } from "@/components/system/icons";
import { menuDangerItemClass, menuItemClass } from "@/components/system/ui";
import { TripColorPicker } from "@/components/trip/trip-color-picker";
import { TripMarkPicker } from "@/components/trip/trip-mark-picker";
import { tripPastel, type TripColor } from "@floc/core/trip/trip-color";
import type { TripMark } from "@floc/core/trip/mark/trip-mark";
import { archiveTrip, deleteTrip } from "@/app/trips/actions";
import { leaveTrip, resetInviteLink } from "@/app/trip/[id]/overview/actions";

export function TripMenu({
  tripId,
  tripName,
  isAdmin,
  archived,
  leaveWarning,
  color,
  mark,
}: {
  tripId: number;
  tripName: string;
  isAdmin: boolean;
  archived: boolean;
  leaveWarning: string;
  color: TripColor | null;
  mark: TripMark | null;
}) {
  return (
    <Menu
      label="Trip settings"
      trigger={<CogIcon />}
    >
      <TripColorPicker tripId={tripId} current={color} />

      <TripMarkPicker tripId={tripId} current={mark} tone={tripPastel(color, tripId)} />

      <form action={leaveTrip}>
        <input type="hidden" name="tripId" value={tripId} />
        <ConfirmSubmit
          variant="ghost"
          message={leaveWarning}
          confirmLabel="Leave the trip"
          className={menuItemClass}
        >
          Leave trip
        </ConfirmSubmit>
      </form>

      {isAdmin ? (
        <form action={resetInviteLink}>
          <input type="hidden" name="tripId" value={tripId} />
          <ConfirmSubmit
            variant="ghost"
            confirmVariant="danger"
            message="Reset the invite link? The old link stops working for anyone still holding it. Everyone already on the trip stays."
            confirmLabel="Reset the link"
            className={menuItemClass}
          >
            Reset invite link
          </ConfirmSubmit>
        </form>
      ) : null}

      {isAdmin && !archived ? (
        <form action={archiveTrip}>
          <input type="hidden" name="tripId" value={tripId} />
          <input type="hidden" name="redirectTo" value="/trips/archived" />
          <ConfirmSubmit
            variant="ghost"
            message={`Archive "${tripName}"? It comes off everyone's list and stays readable — any admin can bring it back from Archived.`}
            confirmLabel="Archive it"
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
            className={menuDangerItemClass}
          >
            Delete trip
          </ConfirmSubmit>
        </form>
      ) : null}
    </Menu>
  );
}
