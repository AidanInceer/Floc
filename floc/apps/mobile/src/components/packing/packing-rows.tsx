/**
 * One line of packing, drawn (#302).
 *
 * A row knows how to draw itself and nothing about where the data came from —
 * it takes what it shows and calls back, so `packing.tsx` keeps the queries.
 *
 * COUNTS ARE YOUR BAG'S ALONE. A shared line has no number, because "three
 * tents" on the group's list is three lines three people claim separately.
 *
 * SELECT MODE REPLACES THE ACTIONS, IT DOES NOT JOIN THEM (#229). While you
 * are picking rows the whole line is one target and the per-row controls go.
 *
 * STATUS IS THE TICK AND THE QUIETER INK, AND IT IS SAID ALOUD (#204). The
 * word "Packed" lives in the accessibility label, not beside every item.
 */
import {
  MAX_PACK_QUANTITY,
  MIN_PACK_QUANTITY,
  type PackCategory,
} from "@floc/core/packing/packing";
import { TEXT_CAPS } from "@floc/core/text/text";
import { Text, View } from "react-native";

import { CrossGlyph, MinusGlyph, PlusGlyph } from "../system/glyphs";
import { InlineRename } from "../system/inline-rename";
import { useTheme } from "../system/theme";
import { CheckBox, GhostIcon, LineFrame, TextAction } from "./line-frame";
import { sharedSaid } from "@/lib/packing/row-words";
import { fonts, size, space } from "@/lib/theme";

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
  /** Added by auto packing (#469). */
  suggested?: boolean;
};

function ClaimControl({
  label,
  open,
  mine,
  onClaim,
}: {
  label: string;
  open: boolean;
  mine: boolean;
  onClaim: (claimed: boolean) => void;
}) {
  if (open) return <TextAction label="I’ll bring it" tone="pen" bold onPress={() => onClaim(true)} accessibilityLabel={`I’ll bring ${label}`} />;
  if (mine) return <TextAction label="Drop it" onPress={() => onClaim(false)} accessibilityLabel={`Drop ${label}`} />;
  return null;
}

function SharedSubline({ said, joinLabel, onJoin }: { said: string; joinLabel: string | null; onJoin: () => void }) {
  const { c } = useTheme();
  if (!said && !joinLabel) return null;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "baseline", columnGap: space.md }}>
      {said ? <Text style={{ color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.small }}>{said}</Text> : null}
      {joinLabel ? <TextAction label="I’ll bring one too" tone="pen" onPress={onJoin} accessibilityLabel={`I’ll bring ${joinLabel} too`} /> : null}
    </View>
  );
}

function Quantity({ value }: { value: number }) {
  const { c } = useTheme();
  return (
    <Text
      style={{
        minWidth: 18,
        textAlign: "center",
        color: c.ink,
        fontFamily: fonts.type,
        fontSize: size.body,
        fontVariant: ["tabular-nums"],
      }}
    >
      {value}
    </Text>
  );
}

export function SharedRow({
  line,
  viewerId,
  selecting,
  selected,
  onToggleSelected,
  onClaim,
  onPacked,
  onRemove,
  onRename,
  laneUserId,
}: {
  line: SharedLine;
  viewerId: string | undefined;
  selecting: boolean;
  selected: boolean;
  onToggleSelected: () => void;
  onClaim: (claimed: boolean) => void;
  onPacked: (packed: boolean) => void;
  onRemove: () => void;
  onRename: (label: string) => Promise<unknown>;
  laneUserId?: string | null;
}) {
  const { c } = useTheme();
  const mine = line.claims.find((claim) => claim.userId === viewerId);
  const laneClaim = laneUserId ? line.claims.find((claim) => claim.userId === laneUserId) : null;
  const open = !laneUserId;
  const yours = !!laneUserId && laneUserId === viewerId;
  const packed = laneClaim?.packed ?? false;
  const said = sharedSaid({
    others: line.claims.filter((claim) => claim.userId !== laneUserId).map((claim) => claim.name),
  });
  const joinable = !open && !mine;

  if (selecting) {
    return (
      <LineFrame
        lead={<CheckBox on={selected} label={line.label} />}
        onPress={onToggleSelected}
        checked={selected}
        accessibilityLabel={line.label}
      >
        <Text style={{ color: c.ink, fontFamily: fonts.sansBold, fontSize: size.body }}>{line.label}</Text>
      </LineFrame>
    );
  }

  const lead = yours ? (
    <CheckBox
      on={packed}
      label={packed ? `${line.label}, packed. Undo` : `Mark ${line.label} packed`}
      onPress={() => onPacked(!packed)}
    />
  ) : laneClaim ? (
    <CheckBox on={packed} label={`${line.label}, ${packed ? "packed" : "not packed"}`} />
  ) : (
    <View style={{ width: 24, height: 24 }} />
  );

  return (
    <LineFrame
      lead={lead}
      trail={
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
          <ClaimControl label={line.label} open={open} mine={!!mine} onClaim={onClaim} />
          <GhostIcon remove label={`Remove ${line.label} for everyone`} onPress={onRemove}>
            {(color) => <CrossGlyph color={color} />}
          </GhostIcon>
        </View>
      }
    >
      <View style={{ opacity: packed ? 0.5 : 1 }}>
        <InlineRename value={line.label} maxLength={TEXT_CAPS.packingLabel} onSave={onRename} />
      </View>
      <SharedSubline said={said} joinLabel={joinable ? line.label : null} onJoin={() => onClaim(true)} />
    </LineFrame>
  );
}

export function MineRow({
  line,
  selecting,
  selected,
  onToggleSelected,
  onStep,
  onPacked,
  onRemove,
  onRename,
}: {
  line: MineLine;
  selecting: boolean;
  selected: boolean;
  onToggleSelected: () => void;
  /** A delta, never a total — see `stepPackingQuantity` on the port for why. */
  onStep: (delta: 1 | -1) => void;
  onPacked: (packed: boolean) => void;
  onRemove: () => void;
  onRename: (label: string) => Promise<unknown>;
}) {
  const { c } = useTheme();
  if (selecting) {
    return (
      <LineFrame
        lead={<CheckBox on={selected} label={line.label} />}
        onPress={onToggleSelected}
        checked={selected}
        accessibilityLabel={`${line.label}, ${line.quantity}`}
      >
        <Text style={{ color: c.ink, fontFamily: fonts.sansBold, fontSize: size.body }}>{line.label}</Text>
      </LineFrame>
    );
  }

  return (
    <LineFrame
      lead={
        <CheckBox
          on={line.packed}
          label={line.packed ? `${line.label}, packed. Undo` : `Mark ${line.label} packed`}
          onPress={() => onPacked(!line.packed)}
        />
      }
      trail={
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <GhostIcon
              compact
              label={`One fewer ${line.label}`}
              disabled={line.quantity <= MIN_PACK_QUANTITY}
              onPress={() => onStep(-1)}
            >
              {(color) => <MinusGlyph color={color} />}
            </GhostIcon>
            <View accessible accessibilityLabel={`Quantity ${line.quantity}`}>
              <Quantity value={line.quantity} />
            </View>
            <GhostIcon
              compact
              label={`One more ${line.label}`}
              disabled={line.quantity >= MAX_PACK_QUANTITY}
              onPress={() => onStep(1)}
            >
              {(color) => <PlusGlyph color={color} />}
            </GhostIcon>
          </View>
          <GhostIcon remove label={`Remove ${line.label}`} onPress={onRemove}>
            {(color) => <CrossGlyph color={color} />}
          </GhostIcon>
        </View>
      }
    >
      <View style={{ opacity: line.packed ? 0.5 : 1 }}>
        <InlineRename value={line.label} maxLength={TEXT_CAPS.packingLabel} onSave={onRename} />
      </View>
      {line.suggested ? (
        <Text style={{ color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.small }}>Suggested</Text>
      ) : null}
    </LineFrame>
  );
}
