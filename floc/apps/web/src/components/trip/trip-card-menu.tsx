/**
 * The trip card's own actions, behind one triple-dot where the role label used
 * to sit (ticket 213). Rename and colour are open to any member; archive and
 * delete stay admin-only (rule 6). Leaving is not here — that lives on the trip
 * header's menu, next to the roster.
 */
import { ConfirmSubmit, Menu, Sheet, SubmitButton } from "@/components/system/client-ui";
import { Field, Input, Stack, menuDangerItemClass, menuItemClass } from "@/components/system/ui";
import { TripColorPicker } from "@/components/trip/trip-color-picker";
import { TEXT_CAPS } from "@floc/core/text/text";
import type { TripColor } from "@floc/core/trip/trip-color";
import { archiveTrip, deleteTrip, muteTrip, renameTripFromMenu } from "@/app/trips/actions";

export function TripCardMenu({
  tripId,
  tripName,
  isAdmin,
  color,
  muted,
}: {
  tripId: number;
  tripName: string;
  isAdmin: boolean;
  color: TripColor | null;
  muted: boolean;
}) {
  return (
    <Menu label={`Actions for ${tripName}`}>
      <Sheet
        bareTrigger
        trigger="Rename"
        title="Rename trip"
        triggerClassName={menuItemClass}
      >
        <form action={renameTripFromMenu}>
          <input type="hidden" name="tripId" value={tripId} />
          <Stack gap={3}>
            <Field label="Name">
              <Input
                name="name"
                defaultValue={tripName}
                required
                maxLength={TEXT_CAPS.tripName}
              />
            </Field>
            <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
          </Stack>
        </form>
      </Sheet>

      <TripColorPicker tripId={tripId} current={color} />

      <form action={muteTrip}>
        <input type="hidden" name="tripId" value={tripId} />
        <input type="hidden" name="muted" value={String(!muted)} />
        <SubmitButton variant="ghost" pendingLabel="…" className={menuItemClass}>
          {muted ? "Unmute trip" : "Mute trip"}
        </SubmitButton>
      </form>

      {isAdmin ? (
        <form action={archiveTrip}>
          <input type="hidden" name="tripId" value={tripId} />
          <input type="hidden" name="redirectTo" value="/trips" />
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
