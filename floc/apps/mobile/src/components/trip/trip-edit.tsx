/**
 * What a member may change about a trip itself: its name, its colour, its tags
 * (tickets 71, 213). The web keeps all three behind the trip's own menu, so the
 * phone keeps them in one sheet rather than inventing a second place.
 *
 * The body only — the trip's layout owns the sheet and the write, because only
 * a route may reach the API.
 *
 * TAGS ARE ROWS, NOT A COMMA FIELD. A comma field asks the reader to know the
 * separator; a row per tag shows the shape it is saved in. `parseTagNames`
 * still normalises, so the phone never decides what a tag is.
 */
import { MAX_TAGS, MAX_TAG_LENGTH } from "@floc/core/trip/tags";
import { TRIP_COLORS, tripPastel, type TripColor } from "@floc/core/trip/trip-color";
import { TRIP_MARKS, TRIP_MARK_LABELS, type TripMark } from "@floc/core/trip/mark/trip-mark";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { TripMarkIcon } from "./trip-mark";
import { CrossGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { Body, Button, Field, IconButton, Label } from "../system/ui";
import { fonts, radius, size, space } from "@/lib/theme";

/** A row keeps an id so deleting one does not hand its text to the next. */
export type TagRow = { id: number; name: string };

export function rowsFromTags(tags: string[]): TagRow[] {
  // Opens on one empty row, not nothing — else the only control is "Add a tag".
  return tags.length > 0
    ? tags.map((name, id) => ({ id, name }))
    : [{ id: 0, name: "" }];
}

function Swatch({
  color,
  picked,
  onPress,
}: {
  color: TripColor;
  picked: boolean;
  onPress: () => void;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={color}
      accessibilityState={{ selected: picked }}
      onPress={onPress}
      style={{
        width: 34,
        height: 34,
        borderRadius: radius.pill,
        backgroundColor: c[color],
        // The ring is the second signal; the swatch carries its colour's name
        // for anyone who cannot see it (#204).
        borderWidth: picked ? 2.5 : StyleSheet.hairlineWidth,
        borderColor: picked ? c.ink : c[`${color}-edge`],
      }}
    />
  );
}

/**
 * Two rows of five, which is the whole set — see `trip-mark.ts` before adding an
 * eleventh. Tapping the mark already on the trip clears it, so "no mark" needs
 * no second control saying None.
 */
function MarkGrid({
  tone,
  mark,
  onChange,
}: {
  tone: TripColor;
  mark: TripMark | null;
  onChange: (mark: TripMark | null) => void;
}) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
      {TRIP_MARKS.map((option) => {
        const picked = mark === option;
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityLabel={TRIP_MARK_LABELS[option]}
            accessibilityState={{ selected: picked }}
            onPress={() => onChange(picked ? null : option)}
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: radius.md,
              backgroundColor: picked ? c[tone] : "transparent",
              borderWidth: picked ? 2 : StyleSheet.hairlineWidth,
              borderColor: picked ? c[`${tone}-ink`] : c.rule,
            }}
          >
            <TripMarkIcon
              mark={option}
              color={picked ? c[`${tone}-ink`] : c["ink-2"]}
              size={21}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

function TagRowInput({
  row,
  onChange,
  onDelete,
}: {
  row: TagRow;
  onChange: (name: string) => void;
  onDelete: () => void;
}) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
      <TextInput
        accessibilityLabel="Tag"
        value={row.name}
        placeholder="beach"
        placeholderTextColor={c["ink-3"]}
        maxLength={MAX_TAG_LENGTH}
        autoCapitalize="none"
        onChangeText={onChange}
        style={{
          flex: 1,
          backgroundColor: c.sheet,
          borderColor: c.rule,
          borderWidth: StyleSheet.hairlineWidth,
          borderRadius: radius.md,
          padding: space.md,
          color: c.ink,
          fontFamily: fonts.type,
          fontSize: size.body,
        }}
      />
      {/* The word "Delete" beside every tag was three quarters as wide as the
          tag itself. The mark is allowed here: the label is said aloud. */}
      <IconButton label={`Delete ${row.name || "this tag"}`} onPress={onDelete}>
        {(colour) => <CrossGlyph color={colour} />}
      </IconButton>
    </View>
  );
}

export function TripEdit({
  tripId,
  name,
  onChangeName,
  color,
  onChangeColor,
  mark,
  onChangeMark,
  rows,
  onChangeRows,
}: {
  tripId: number;
  name: string;
  onChangeName: (name: string) => void;
  /** The picked colour, or null while the id rotation is still filling in. */
  color: TripColor | null;
  onChangeColor: (color: TripColor) => void;
  /** The picked mark, or null for the pastel alone (#318). */
  mark: TripMark | null;
  onChangeMark: (mark: TripMark | null) => void;
  rows: TagRow[];
  onChangeRows: (rows: TagRow[]) => void;
}) {
  const nextId = rows.reduce((top, row) => Math.max(top, row.id), 0) + 1;

  return (
    <View style={{ padding: space.lg, gap: space.md }}>
      <Field label="Trip name" value={name} onChangeText={onChangeName} autoFocus />

      <View style={{ gap: space.sm }}>
        <Label>Colour</Label>
        <View style={{ flexDirection: "row", gap: space.md }}>
          {TRIP_COLORS.map((option) => (
            <Swatch
              key={option}
              color={option}
              picked={color === option}
              onPress={() => onChangeColor(option)}
            />
          ))}
        </View>
      </View>

      <View style={{ gap: space.sm }}>
        <Label>Icon</Label>
        <MarkGrid tone={tripPastel(color, tripId)} mark={mark} onChange={onChangeMark} />
      </View>

      <View style={{ gap: space.sm }}>
        <Label>Tags</Label>
        {rows.map((row) => (
          <TagRowInput
            key={row.id}
            row={row}
            onChange={(text) =>
              onChangeRows(rows.map((r) => (r.id === row.id ? { ...r, name: text } : r)))
            }
            onDelete={() => onChangeRows(rows.filter((r) => r.id !== row.id))}
          />
        ))}
        {rows.length < MAX_TAGS ? (
          <Button
            label="Add a tag"
            variant="quiet"
            onPress={() => onChangeRows([...rows, { id: nextId, name: "" }])}
          />
        ) : (
          <Body tone="ink-2">{MAX_TAGS} tags is the limit — delete one to add another.</Body>
        )}
      </View>
    </View>
  );
}
