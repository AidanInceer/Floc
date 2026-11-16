import { parseTagNames, readTags } from "@floc/core/trip/tags";
import { readTripColor, type TripColor } from "@floc/core/trip/trip-color";
import { readTripMark, type TripMark } from "@floc/core/trip/mark/trip-mark";

import { useState, type ReactNode } from "react";
import { View } from "react-native";

import { Sheet } from "../system/sheet";
import { TripActions } from "./trip-actions";
import { TripEdit, rowsFromTags, type TagRow } from "./trip-edit";
import { CrossGlyph } from "../system/glyphs";
import { Body, IconButton } from "../system/ui";
import { space } from "@/lib/theme";
import { sheetExit } from "@/lib/trip/trip-sheet-exit";
import type { TripEditPayload } from "@/lib/trip/trip-write";

export type TripSheetTrip = {
  id: number;
  name: string;
  colorKey: string | null;
  mark: string | null;
  tags: string[] | null;
  role: string;
  archived: boolean;
};

type Draft = {
  name: string;
  color: TripColor | null;
  mark: TripMark | null;
  rows: TagRow[];
};

export function draftFor(trip: TripSheetTrip): Draft {
  return {
    name: trip.name,
    color: readTripColor(trip.colorKey),
    mark: readTripMark(trip.mark),
    rows: rowsFromTags(readTags(trip.tags)),
  };
}

export function TripSheet({
  trip,
  draft,
  onChange,
  onClose,
  write,
  children,
}: {
  children?: ReactNode;
  trip: TripSheetTrip | null;
  draft: Draft | null;
  onChange: (draft: Draft) => void;
  onClose: () => void;
  write: {
    save: (payload: {
      name: string;
      color: TripColor | null;
      mark: TripMark | null;
      tags: string[];
    }) => void;
    setArchived: (archived: boolean) => void;
    destroy: () => void;
    saving: boolean;
    leaving: boolean;
    error: string | null;
  };
}) {
  const [blank, setBlank] = useState(false);
  const done = () => {
    if (draft === null || trip === null) return onClose();
    if (write.saving) return;
    if (write.error) return onClose();
    const exit = sheetExit(payloadOf(draftFor(trip)), payloadOf(draft));
    setBlank(exit.kind === "blank");
    if (exit.kind === "close") onClose();
    if (exit.kind === "save") write.save(exit.payload);
  };

  return (
    <Sheet open={draft !== null} onClose={done}>
      {draft !== null && trip !== null ? (
        <View style={{ gap: space.md, paddingBottom: space.lg }}>
          <View style={{ alignItems: "flex-end", paddingHorizontal: space.lg, paddingTop: space.sm }}>
            <IconButton label="Close" onPress={done}>
              {(colour) => <CrossGlyph color={colour} />}
            </IconButton>
          </View>
          <TripEdit
            tripId={trip.id}
            name={draft.name}
            onChangeName={(name) => onChange({ ...draft, name })}
            color={draft.color}
            onChangeColor={(color) => onChange({ ...draft, color })}
            mark={draft.mark}
            onChangeMark={(mark) => onChange({ ...draft, mark })}
            rows={draft.rows}
            onChangeRows={(rows) => onChange({ ...draft, rows })}
          />
          <View style={{ paddingHorizontal: space.lg, gap: space.sm }}>
            {children}
            {blank ? <Body tone="red">A trip needs a name.</Body> : null}
            {write.error ? (
              <Body tone="red">{`${write.error} Not saved — close again to leave it.`}</Body>
            ) : null}
            <TripActions
              isAdmin={trip.role === "admin"}
              archived={trip.archived}
              busy={write.leaving}
              onArchive={write.setArchived}
              onDelete={write.destroy}
            />
          </View>
        </View>
      ) : null}
    </Sheet>
  );
}

function payloadOf(draft: Draft): TripEditPayload {
  return {
    name: draft.name,
    color: draft.color,
    mark: draft.mark,
    tags: parseTagNames(draft.rows.map((row) => row.name)),
  };
}

export type { Draft as TripDraft };
