import { PACK_TIERS, PACK_TIER_LABELS, type PackTier } from "@floc/core/packing/packing";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../system/theme";
import { Button } from "../system/ui";
import { TextAction } from "./line-frame";
import { fonts, radius, size, space } from "@/lib/theme";

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

type Press = { busy: boolean; onPress: () => void };

export function PackingSetup({
  why,
  tier,
  onTier,
  ideaCount,
  fill,
  error,
}: {
  why: string;
  tier: PackTier;
  onTier: (tier: PackTier) => void;
  ideaCount: number;
  fill: Press;
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
      {ideaCount > 0 ? (
        <View style={{ flexDirection: "row" }}>
          <Button label={`Add all ${ideaCount}`} variant="quiet" fit="small" busy={fill.busy} onPress={fill.onPress} />
        </View>
      ) : null}
      {error ? <Text style={{ ...say, color: c.red }}>{error}</Text> : null}
    </View>
  );
}

export function PackingUpgrade({ onUpgrade }: { onUpgrade: () => void }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: space.md }}>
      <Text style={{ flex: 1, color: c["ink-2"], fontFamily: fonts.sans, fontSize: size.small, lineHeight: 20 }}>
        Auto packing fills your bag from the trip’s nights and weather.
      </Text>
      <View style={{ height: 20, justifyContent: "center" }}>
        <TextAction label="Upgrade to Pro" tone="ink" bold onPress={onUpgrade} />
      </View>
    </View>
  );
}
