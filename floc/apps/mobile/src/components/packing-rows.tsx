/**
 * One line of packing, drawn (#302).
 *
 * WHY THESE LEFT THE SCREEN. The packing screen draws two lists, groups them,
 * filters them and offers a form; adding a row's own markup to that put one
 * file past the point where any of it could be read. A row knows how to draw
 * itself and nothing about where the data came from — it takes what it shows
 * and calls back, so `packing.tsx` keeps the queries and these keep the paint.
 *
 * ROWS, NOT CARDS. Each line used to be a card with a stack of full-width
 * buttons; five things filled four screens. The actions are glyphs at the
 * house weight, each carrying its own `accessibilityLabel` — so the drawing is
 * never the only thing saying what a control does.
 *
 * THE STATUS IS STILL A WORD (#204). A glyph replaced the button, never the
 * status: "Unclaimed", "Not packed", "2 of 3 packed" stay in text beside it.
 *
 * COUNTS ARE YOUR BAG'S ALONE. A shared line has no number, because "three
 * tents" on the group's list is three lines three people claim separately.
 */
import {
  MAX_PACK_QUANTITY,
  MIN_PACK_QUANTITY,
  packingStatusLabel,
  type PackCategory,
} from "@floc/core/packing";
import { View } from "react-native";

import { ClaimGlyph, CrossGlyph, MinusGlyph, PlusGlyph, TickGlyph } from "./glyphs";
import { Body, Figure, IconButton, Label, Row } from "./ui";
import { space } from "@/lib/theme";

/** Only nullness is read by `packingStatusLabel`; the wire carries a boolean, not a time (rule 10). */
const SOME_TIME = new Date(0);

/** An `IconButton`, so an unclaimed line indents like a claimed one. */
const TICK_SLOT = 34;

export type SharedLine = {
  id: number;
  label: string;
  category: PackCategory;
  claims: { userId: string; name: string; packed: boolean }[];
};

export type MineLine = {
  id: number;
  label: string;
  category: PackCategory;
  quantity: number;
  packed: boolean;
};

export function SharedRow({
  line,
  viewerId,
  onClaim,
  onPacked,
  onRemove,
}: {
  line: SharedLine;
  viewerId: string | undefined;
  onClaim: (claimed: boolean) => void;
  onPacked: (packed: boolean) => void;
  onRemove: () => void;
}) {
  const mine = line.claims.find((claim) => claim.userId === viewerId);
  // Names only. Whether it is packed is already the status beside them, and
  // "Packed · Aidan (packed)" says it twice.
  const bringing = line.claims.map((claim) => claim.name).join(", ");

  return (
    <Row>
      {/* The tick leads, where a checkbox belongs — reading a line starts with
          whether it is done. The slot is held even when there is nothing to
          tick, so every label starts in the same column. */}
      <View style={{ width: TICK_SLOT }}>
        {mine ? (
          <IconButton
            label={mine.packed ? "Packed — undo" : "I've packed it"}
            on={mine.packed}
            onPress={() => onPacked(!mine.packed)}
          >
            {(color) => <TickGlyph color={color} />}
          </IconButton>
        ) : null}
      </View>

      <View style={{ flex: 1, gap: space.xs }}>
        <Body bold>{line.label}</Body>
        {/* Status and who, on ONE line. They were two, so claiming a line made
            the row grow by a line and the list jumped under the finger. Who is
            bringing it is still said by name — a colour would say the same
            thing to fewer people (#204). */}
        <Label>
          {[
            packingStatusLabel(
              line.claims.map((claim) => ({ packedAt: claim.packed ? SOME_TIME : null })),
            ),
            bringing,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Label>
      </View>

      <IconButton
        label={mine ? "Not me after all" : "I'll bring it"}
        on={!!mine}
        onPress={() => onClaim(!mine)}
      >
        {(color) => <ClaimGlyph color={color} />}
      </IconButton>

      {/* The list is the group's, so a line nobody wants is anyone's to drop. */}
      <IconButton label="Remove" tone="danger" onPress={onRemove}>
        {(color) => <CrossGlyph color={color} />}
      </IconButton>
    </Row>
  );
}

export function MineRow({
  line,
  onStep,
  onPacked,
  onRemove,
}: {
  line: MineLine;
  /** A delta, never a total — see `stepPackingQuantity` on the port for why. */
  onStep: (delta: 1 | -1) => void;
  onPacked: (packed: boolean) => void;
  onRemove: () => void;
}) {
  return (
    <Row>
      <View style={{ width: TICK_SLOT }}>
        <IconButton
          label={line.packed ? "Packed — undo" : "I've packed it"}
          on={line.packed}
          onPress={() => onPacked(!line.packed)}
        >
          {(color) => <TickGlyph color={color} />}
        </IconButton>
      </View>

      <View style={{ flex: 1, gap: space.xs }}>
        <Body bold>{line.label}</Body>
        <Label>{line.packed ? "Packed" : "Not packed"}</Label>
      </View>

      {/* The count between its two nudges, so the number reads as the thing
          the buttons change rather than a third control. */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
        <IconButton
          label={`One fewer ${line.label}`}
          disabled={line.quantity <= MIN_PACK_QUANTITY}
          onPress={() => onStep(-1)}
        >
          {(color) => <MinusGlyph color={color} />}
        </IconButton>
        <View style={{ minWidth: 20, alignItems: "center" }}>
          <Figure>{line.quantity}</Figure>
        </View>
        <IconButton
          label={`One more ${line.label}`}
          disabled={line.quantity >= MAX_PACK_QUANTITY}
          onPress={() => onStep(1)}
        >
          {(color) => <PlusGlyph color={color} />}
        </IconButton>
      </View>

      <IconButton label="Remove" tone="danger" onPress={onRemove}>
        {(color) => <CrossGlyph color={color} />}
      </IconButton>
    </Row>
  );
}
