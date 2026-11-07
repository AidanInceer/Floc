/**
 * What a trip's packing is set up with: how much it packs and auto packing's
 * presses (tickets 220, 221, 230, 469). The kit sheet opens from the bag's
 * heading, not from here.
 *
 * IT IS NOT A GATE (rule 4). Every control here is optional; a trip packs fine
 * with none of them touched, and the lists below never wait on it.
 *
 * AUTO PACKING IS PAID, THE LIST IS NOT (#248). Without the entitlement the
 * ideas and the tier go and one line says what Pro adds; what auto packing
 * already wrote stays, and Remove suggested still works (#469).
 *
 * QUIET ON PURPOSE. Words and text presses on the page's ground, no card: the
 * lists are what the tab is for.
 */
import { PACK_TIERS, PACK_TIER_LABELS, type PackTier } from "@floc/core/packing/packing";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../system/theme";
import { Button } from "../system/ui";
import { TextAction } from "./line-frame";
import { fonts, radius, size, space } from "@/lib/theme";

/** A word that is also a control — the fill is the second signal, never the only one (#204). */
function Chip({ word, on, onPress }: { word: string; on: boolean; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      hitSlop={6}
      style={{
        borderRadius: radius.pill,
        paddingVertical: space.xs,
        paddingHorizontal: space.md,
        backgroundColor: on ? c["pen-2"] : "transparent",
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: on ? c.pen : c.rule,
      }}
    >
      <Text
        style={{
          color: on ? c["pen-deep"] : c["ink-2"],
          fontFamily: on ? fonts.sansBold : fonts.sans,
          fontSize: size.small,
        }}
      >
        {word}
      </Text>
    </Pressable>
  );
}

type Ideas = { count: number; hidden: boolean; onToggle: () => void };
type Press = { busy: boolean; onPress: () => void };
type Suggested = { count: number; onPress: () => void };

function RemoveSuggested({ count, onPress }: Suggested) {
  if (count === 0) return null;
  return <TextAction label={`Remove suggested (${count})`} onPress={onPress} />;
}

/** Auto packing for a Pro member (#469): why, the tier, Add all. The ideas sit in the cubes. */
export function PackingSetup({
  why,
  tier,
  onTier,
  ideas,
  fill,
  removeSuggested,
  error,
}: {
  why: string;
  tier: PackTier;
  onTier: (tier: PackTier) => void;
  ideas: Ideas;
  fill: Press;
  removeSuggested: Suggested;
  error: string | null;
}) {
  const { c } = useTheme();
  const say = { color: c["ink-2"], fontFamily: fonts.sans, fontSize: size.small } as const;
  return (
    <View style={{ gap: space.sm }}>
      <Text style={say}>{why}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: space.sm }}>
        {PACK_TIERS.map((option) => (
          <Chip key={option} word={PACK_TIER_LABELS[option]} on={option === tier} onPress={() => onTier(option)} />
        ))}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", columnGap: space.lg, rowGap: space.sm }}>
        {ideas.count > 0 && !ideas.hidden ? (
          <Button label={`Add all ${ideas.count}`} variant="quiet" fit="small" busy={fill.busy} onPress={fill.onPress} />
        ) : null}
        {ideas.count > 0 ? (
          <TextAction label={ideas.hidden ? `Show ${ideas.count} ideas` : "Hide ideas"} onPress={ideas.onToggle} />
        ) : null}
        <RemoveSuggested {...removeSuggested} />
      </View>
      {error ? <Text style={{ ...say, color: c.red }}>{error}</Text> : null}
    </View>
  );
}

/** Free (#469, Aidan): no ideas and no tier. One quiet line and the way to Pro. */
export function PackingUpgrade({
  onUpgrade,
  removeSuggested,
}: {
  onUpgrade: () => void;
  removeSuggested: Suggested;
}) {
  const { c } = useTheme();
  return (
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: space.md }}>
        <Text style={{ flex: 1, color: c["ink-2"], fontFamily: fonts.sans, fontSize: size.small, lineHeight: 20 }}>
          Auto packing fills your bag from the trip’s nights and weather.
        </Text>
        <View style={{ height: 20, justifyContent: "center" }}>
          <TextAction label="Upgrade to Pro" tone="ink" bold onPress={onUpgrade} />
        </View>
      </View>
      <RemoveSuggested {...removeSuggested} />
    </View>
  );
}
