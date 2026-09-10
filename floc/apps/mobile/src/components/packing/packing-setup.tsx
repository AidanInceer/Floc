/**
 * What a trip's packing is set up with, once: how much it packs, and the two
 * presses that fill a bag (tickets 220, 221, 230).
 *
 * TWO LINES, NOT FOUR. This began as a label, a row of tiers, and two
 * full-width buttons stacked — four lines of furniture above the thing you
 * came to do, on every visit. The tier sits on its own label's row and the two
 * actions share one. Nothing was dropped to get there.
 *
 * IT IS NOT A GATE (rule 4). Every control here is optional; a trip packs fine
 * with none of them touched, and the lists below never wait on it.
 *
 * AUTO-FILL IS PAID, THE LIST IS NOT (#248). When the entitlement is off the
 * press goes, and what it already wrote stays — so this says the press is
 * unavailable rather than pretending the feature does not exist.
 */
import { PACK_TIERS, PACK_TIER_LABELS, type PackTier } from "@floc/core/packing/packing";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../system/theme";
import { Body, Card } from "../system/ui";
import type { PackingKit } from "./packing-kit-sheet";
import { fonts, radius, size, space } from "@/lib/theme";

/** A word that is also a control — the fill is the second signal, never the only one (#204). */
function Chip({
  word,
  on,
  onPress,
}: {
  word: string;
  on: boolean;
  onPress: () => void;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      hitSlop={4}
      style={{
        borderRadius: radius.pill,
        paddingVertical: space.xs,
        paddingHorizontal: space.sm,
        backgroundColor: on ? c["sheet-2"] : "transparent",
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: on ? c["rule-2"] ?? c.rule : c.rule,
      }}
    >
      <Text
        style={{
          color: on ? c.ink : c["ink-2"],
          fontFamily: on ? fonts.sansBold : fonts.sans,
          fontSize: size.small,
        }}
      >
        {word}
      </Text>
    </Pressable>
  );
}

/** Half-width, so the two actions share one line rather than taking one each. */
function HalfButton({
  label,
  disabled,
  busy,
  onPress,
}: {
  label: string;
  disabled?: boolean;
  busy?: boolean;
  onPress: () => void;
}) {
  const { c } = useTheme();
  const off = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!busy }}
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => ({
        flex: 1,
        borderRadius: radius.md,
        paddingVertical: space.sm,
        alignItems: "center",
        backgroundColor: c["sheet-2"],
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: c.rule,
        opacity: off ? 0.45 : pressed ? 0.75 : 1,
      })}
    >
      <Text
        style={{ color: c.ink, fontFamily: fonts.sansBold, fontSize: size.small }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function PackingSetup({
  tier,
  onTier,
  kits,
  canAutoFill,
  filling,
  onFill,
  onPickKit,
  error,
}: {
  tier: PackTier;
  onTier: (tier: PackTier) => void;
  kits: PackingKit[];
  canAutoFill: boolean;
  filling: boolean;
  onFill: () => void;
  onPickKit: () => void;
  error: string | null;
}) {
  const { c } = useTheme();

  return (
    <Card style={{ paddingVertical: space.md, gap: space.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
        <Text
          style={{
            flex: 1,
            color: c["ink-3"],
            fontFamily: fonts.type,
            fontSize: size.label,
            textTransform: "uppercase",
            letterSpacing: 0.6,
          }}
        >
          This trip packs
        </Text>
        {PACK_TIERS.map((option) => (
          <Chip
            key={option}
            word={PACK_TIER_LABELS[option]}
            on={option === tier}
            onPress={() => onTier(option)}
          />
        ))}
      </View>

      <View style={{ flexDirection: "row", gap: space.sm }}>
        <HalfButton
          label="Fill my bag"
          busy={filling}
          disabled={!canAutoFill}
          onPress={onFill}
        />
        {/* Never dead. With no kits this is where the first one is made, so
            disabling it hid the only way out of having none. */}
        <HalfButton
          label={kits.length === 0 ? "Kits" : `Kits (${kits.length})`}
          onPress={onPickKit}
        />
      </View>

      {/* What is missing is worth saying; what is drawn is not (#126). Both of
          these are absences a press cannot explain on its own. */}
      {!canAutoFill ? <Body tone="ink-3">Filling your bag is a Pro feature.</Body> : null}
      {error ? <Body tone="red">{error}</Body> : null}
    </Card>
  );
}
