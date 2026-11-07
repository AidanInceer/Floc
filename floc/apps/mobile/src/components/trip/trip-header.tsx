/**
 * Why a fixed row, not a scrolling rail: seven words scrolled sideways and snapped back after a
 * pick, so the open section sat off-screen. Equal cells — mark over word — fit all seven at once.
 */
import { SECTION_COLOURS } from "@floc/core/design/section-colours";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../system/theme";
import { SectionGlyph } from "./section-glyph";
import { fonts, radius, size, space } from "@/lib/theme";
import type { Pastel } from "@floc/core/design/pastels";

export type Section = {
  /** The route to push, relative to the trip. `""` is the trip's own index. */
  route: string;
  label: string;
};

function BackArrow({ color }: { color: string }) {
  return (
    <View style={{ width: 20, height: 20, justifyContent: "center" }}>
      <View style={{ height: 1.4, backgroundColor: color }} />
      <View
        style={{
          position: "absolute",
          left: 0,
          width: 9,
          height: 9,
          borderLeftWidth: 1.4,
          borderTopWidth: 1.4,
          borderColor: color,
          transform: [{ rotate: "-45deg" }],
        }}
      />
    </View>
  );
}

function BalanceChip({ text, tone, onPress }: { text: string; tone: Pastel; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Money, ${text}`} onPress={onPress} hitSlop={8}>
      <View
        style={{
          backgroundColor: c[tone],
          borderRadius: radius.pill,
          paddingVertical: space.xs,
          paddingHorizontal: space.sm,
        }}
      >
        <Text
          style={{
            color: c[`${tone}-ink`],
            fontFamily: fonts.type,
            fontSize: size.small,
            fontVariant: ["tabular-nums"],
          }}
        >
          {text}
        </Text>
      </View>
    </Pressable>
  );
}

function TitleBar({
  title,
  balance,
  owing,
  onGo,
}: {
  title: string;
  balance: string | null;
  owing: boolean;
  onGo: (route: string) => void;
}) {
  const { c } = useTheme();
  const router = useRouter();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        paddingHorizontal: space.lg,
        paddingTop: space.sm,
        paddingBottom: space.md,
      }}
    >
      {/* Why: out of a trip is the list of trips, not wherever the history happened to be (#302). */}
      <Pressable accessibilityRole="button" accessibilityLabel="All trips" hitSlop={12} onPress={() => router.navigate("/trips")}>
        <BackArrow color={c.ink} />
      </Pressable>
      {/* Why: the name as the person typed it — sentence case is theirs to choose, not ours to change. */}
      <Text
        numberOfLines={2}
        style={{ flex: 1, color: c.ink, fontFamily: fonts.display, fontSize: size.heading }}
      >
        {title}
      </Text>
      {balance !== null ? (
        <BalanceChip text={balance} tone={owing ? "pastel-red" : "pastel-green"} onPress={() => onGo("money")} />
      ) : null}
    </View>
  );
}

function SectionCell({ section, on, onGo }: { section: Section; on: boolean; onGo: (route: string) => void }) {
  const { c } = useTheme();
  const colour = SECTION_COLOURS[section.route];
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={section.label}
      accessibilityState={{ selected: on }}
      onPress={() => onGo(section.route)}
      style={{ flex: 1, alignItems: "center", gap: 2, paddingBottom: space.sm }}
    >
      <View
        style={{
          width: 36,
          height: 28,
          borderRadius: radius.sm,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: on ? c[`pastel-${colour}`] : "transparent",
        }}
      >
        <SectionGlyph route={section.route} color={on ? c[`pastel-${colour}-ink`] : c["ink-2"]} />
      </View>
      {/* Why: seven cells on a 360dp phone with larger text cut "Overview"; the word shrinks rather than clips. */}
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={1.15}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
        style={{
          color: on ? c.ink : c["ink-3"],
          fontFamily: on ? fonts.sansBold : fonts.sans,
          fontSize: size.label,
        }}
      >
        {section.label}
      </Text>
    </Pressable>
  );
}

export function TripHeader({
  title,
  sections,
  current,
  balance,
  owing,
  onGo,
}: {
  title: string;
  sections: Section[];
  /** The section showing, as a route — `""` for the trip's index. */
  current: string;
  /** The figure, or null when there is nothing spent to have a balance about. */
  balance: string | null;
  owing: boolean;
  onGo: (route: string) => void;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        backgroundColor: c.sheet,
        paddingTop: insets.top,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: c.rule,
      }}
    >
      <TitleBar title={title} balance={balance} owing={owing} onGo={onGo} />
      <View accessibilityRole="tablist" style={{ flexDirection: "row", paddingHorizontal: space.xs }}>
        {sections.map((section) => (
          <SectionCell key={section.route} section={section} on={section.route === current} onGo={onGo} />
        ))}
      </View>
    </View>
  );
}
