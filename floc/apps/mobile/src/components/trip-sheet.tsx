/**
 * Everything you can do to a trip itself, in one sheet (#71, #213, #302).
 *
 * OPENED FROM THE CARD ON THE TRIPS LIST, as the web opens its menu from the
 * card. This file holds the draft and the shape; `useTripWrite` holds the
 * wire, and `TripActions` holds the footer the sheet ends on.
 *
 * ONE DRAFT, SO IT CANNOT BE HALF-OPEN. The draft is seeded when the sheet
 * opens and thrown away when it shuts.
 */
import { parseTagNames, readTags } from "@floc/core/tags";
import { readTripColor, type TripColor } from "@floc/core/trip-color";

import { View } from "react-native";

import { Sheet } from "./sheet";
import { TripActions } from "./trip-actions";
import { TripEdit, rowsFromTags, type TagRow } from "./trip-edit";
import { Body } from "./ui";
import { space } from "@/lib/theme";

export type TripSheetTrip = {
  name: string;
  colorKey: string | null;
  tags: string[] | null;
  role: string;
  archived: boolean;
};

type Draft = { name: string; color: TripColor | null; rows: TagRow[] };

export function draftFor(trip: TripSheetTrip): Draft {
  return {
    name: trip.name,
    color: readTripColor(trip.colorKey),
    rows: rowsFromTags(readTags(trip.tags)),
  };
}

export function TripSheet({
  trip,
  draft,
  onChange,
  onClose,
  write,
}: {
  trip: TripSheetTrip | null;
  /** Null when the sheet is shut. The caller owns it so it survives a re-read of the trip. */
  draft: Draft | null;
  onChange: (draft: Draft) => void;
  onClose: () => void;
  write: {
    save: (payload: { name: string; color: TripColor | null; tags: string[] }) => void;
    setArchived: (archived: boolean) => void;
    destroy: () => void;
    saving: boolean;
    leaving: boolean;
    error: string | null;
  };
}) {
  return (
    <Sheet open={draft !== null} onClose={onClose}>
      {draft !== null && trip !== null ? (
        <View style={{ gap: space.md, paddingBottom: space.lg }}>
          <TripEdit
            name={draft.name}
            onChangeName={(name) => onChange({ ...draft, name })}
            color={draft.color}
            onChangeColor={(color) => onChange({ ...draft, color })}
            rows={draft.rows}
            onChangeRows={(rows) => onChange({ ...draft, rows })}
          />
          <View style={{ paddingHorizontal: space.lg, gap: space.sm }}>
            {write.error ? <Body tone="red">{write.error}</Body> : null}
            <TripActions
              isAdmin={trip.role === "admin"}
              archived={trip.archived}
              busy={write.leaving}
              saving={write.saving}
              onArchive={write.setArchived}
              onDelete={write.destroy}
              onSave={() =>
                write.save({
                  name: draft.name,
                  color: draft.color,
                  tags: parseTagNames(draft.rows.map((row) => row.name)),
                })
              }
            />
          </View>
        </View>
      ) : null}
    </Sheet>
  );
}

export type { Draft as TripDraft };
