import { ConfirmSubmit, Menu, Sheet, SubmitButton } from "@/components/system/client-ui";
import { Field, Input, Stack, menuDangerItemClass, menuItemClass } from "@/components/system/ui";
import { TripColorPicker } from "@/components/trip/trip-color-picker";
import { TripMarkPicker } from "@/components/trip/trip-mark-picker";
import { TEXT_CAPS } from "@floc/core/text/text";
import { tripPastel, type TripColor } from "@floc/core/trip/trip-color";
import type { TripMark } from "@floc/core/trip/mark/trip-mark";
import { archiveTrip, deleteTrip, renameTripFromMenu } from "@/app/trips/actions";

export function TripCardMenu({
  tripId,
  tripName,
  isAdmin,
  color,
  mark,
}: {
  tripId: number;
  tripName: string;
  isAdmin: boolean;
  color: TripColor | null;
  mark: TripMark | null;
}) {
  return (
    <Menu label={`Actions for ${tripName}`}>
      <TripColorPicker tripId={tripId} current={color} />

      <TripMarkPicker tripId={tripId} current={mark} tone={tripPastel(color, tripId)} />

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
            <SubmitButton>Save</SubmitButton>
          </Stack>
        </form>
      </Sheet>

      {isAdmin ? (
        <form action={archiveTrip}>
          <input type="hidden" name="tripId" value={tripId} />
          <input type="hidden" name="redirectTo" value="/trips" />
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
            confirmVariant="danger"
            message={`Delete "${tripName}" for everyone? This can't be undone.`}
            confirmLabel="Delete it"
            alternative={{ label: "Archive instead", action: archiveTrip }}
            className={menuDangerItemClass}
          >
            Delete trip
          </ConfirmSubmit>
        </form>
      ) : null}
    </Menu>
  );
}
