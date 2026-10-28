/**
 * What a trip's packing is set up with: how much it packs, auto packing's
 * presses, and the kit sheet (tickets 220, 221, 230, 469).
 *
 * TWO LINES, NOT FOUR. This began as a label, a row of tiers, and two
 * full-width buttons stacked — four lines of furniture above the thing you
 * came to do, on every visit. The tier sits on its own label's row and the two
 * actions share one. Nothing was dropped to get there.
 *
 * IT IS NOT A GATE (rule 4). Every control here is optional; a trip packs fine
 * with none of them touched, and the lists below never wait on it.
 *
 * AUTO PACKING IS PAID, THE LIST IS NOT (#248). Without the entitlement the
 * ideas and the tier go and one line says what Pro adds; what auto packing
 * already wrote stays, and Remove suggested still works (#469).
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

/** A quiet text press, for the two undo-ish actions that should not shout. */
function TextPress({ label, onPress }: { label: string; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={6}>
      <Text style={{ color: c["ink-2"], fontFamily: fonts.sans, fontSize: size.small, textDecorationLine: "underline" }}>
        {label}
      </Text>
    </Pressable>
  );
}

type Ideas = { count: number; hidden: boolean; onToggle: () => void };
type Press = { busy: boolean; onPress: () => void };

/** Auto packing for a Pro member (#469): why, the tier, Add all, and the kit sheet. The ideas sit in the cubes. */
export function PackingSetup({
  why,
  tier,
  onTier,
  ideas,
  fill,
  kits,
  onPickKit,
  removeSuggested,
  error,
}: {
  why: string;
  tier: PackTier;
  onTier: (tier: PackTier) => void;
  ideas: Ideas;
  fill: Press;
  kits: PackingKit[];
  onPickKit: () => void;
  removeSuggested: { count: number; onPress: () => void };
  error: string | null;
}) {
  return (
    <Card style={{ paddingVertical: space.md, gap: space.sm }}>
      <Body tone="ink-2">{why}</Body>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
        {PACK_TIERS.map((option) => (
          <Chip key={option} word={PACK_TIER_LABELS[option]} on={option === tier} onPress={() => onTier(option)} />
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: space.sm }}>
        <HalfButton
          label={ideas.count > 0 ? `Add all ${ideas.count}` : "Nothing to add"}
          busy={fill.busy}
          disabled={ideas.count === 0 || ideas.hidden}
          onPress={fill.onPress}
        />
        {/* Never dead. With no kits this is where the first one is made. */}
        <HalfButton label={kits.length === 0 ? "Kits" : `Kits (${kits.length})`} onPress={onPickKit} />
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>
        {ideas.count > 0 ? <TextPress label={ideas.hidden ? `Show ${ideas.count} ideas` : "Hide ideas"} onPress={ideas.onToggle} /> : null}
        {removeSuggested.count > 0 ? <TextPress label={`Remove suggested (${removeSuggested.count})`} onPress={removeSuggested.onPress} /> : null}
      </View>
      {error ? <Body tone="red">{error}</Body> : null}
    </Card>
  );
}

/** Free (#469, Aidan): no ideas and no tier. One line, the way to Pro, and the kits that stay free. */
export function PackingUpgrade({
  kits,
  onPickKit,
  onUpgrade,
  removeSuggested,
}: {
  kits: PackingKit[];
  onPickKit: () => void;
  onUpgrade: () => void;
  removeSuggested: { count: number; onPress: () => void };
}) {
  return (
    <Card style={{ paddingVertical: space.md, gap: space.sm }}>
      <Body tone="ink-2">Auto packing fills your bag from the trip’s nights and weather.</Body>
      <View style={{ flexDirection: "row", gap: space.sm }}>
        <HalfButton label="Upgrade to Pro" onPress={onUpgrade} />
        <HalfButton label={kits.length === 0 ? "Kits" : `Kits (${kits.length})`} onPress={onPickKit} />
      </View>
      {removeSuggested.count > 0 ? (
        <TextPress label={`Remove suggested (${removeSuggested.count})`} onPress={removeSuggested.onPress} />
      ) : null}
    </Card>
  );
}
