/**
 * A trip's own header: the name, the balance, and a rail of its sections.
 *
 * WHAT THIS REPLACES. #299 put the sections behind a hamburger and a sheet,
 * and wrote down its own weak point: a drawer gets ignored. It was. This is
 * the fix — every section is a word on screen, one tap away, and the rail
 * costs one line of height instead of a modal.
 *
 * SIX WORDS FIT. That is why a rail works here and would not have at #299's
 * seven-with-Who: they sit on one line on a phone, so nothing is hidden and
 * there is no "More" reinventing the drawer. It scrolls anyway, because a
 * longer trip name or a larger type size can push a word off the edge.
 *
 * A RAIL, NOT A TAB BAR. Underline and weight, no pills and no fill — the
 * bottom bar is the app's navigation and this is one level below it. Two
 * things that look equally important is the confusion #299 was avoiding.
 *
 * PLANNING ORDER (see the trip layout). Not alphabetical, not by traffic.
 */
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "./theme";
import { fonts, radius, size, space } from "@/lib/theme";

export type Section = {
  /** The route to push, relative to the trip. `""` is the trip's own index. */
  route: string;
  label: string;
};

/** The back arrow, drawn rather than imported — one line and one corner. */
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

function BalanceChip({
  text,
  tone,
  onPress,
}: {
  text: string;
  tone: string;
  onPress: () => void;
}) {
  const { c } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Money, ${text}`} onPress={onPress}>
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

export function TripHeader({
  title,
  sections,
  current,
  balance,
  owing,
  onGo,
  onEditName,
}: {
  title: string;
  sections: Section[];
  /** The section showing, as a route — `""` for the trip's index. */
  current: string;
  /** The figure, or null when there is nothing spent to have a balance about. */
  balance: string | null;
  owing: boolean;
  onGo: (route: string) => void;
  /** Tapping the name renames it. The trip's own layout owns the sheet and the write. */
  onEditName: () => void;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      style={{
        backgroundColor: c.sheet,
        paddingTop: insets.top,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: c.rule,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: space.md,
          paddingHorizontal: space.lg,
          paddingVertical: space.md,
        }}
      >
        {/* To the trip list, not to wherever you happened to be. `router.back`
            popped the navigation history, so opening a trip from Explore and
            leaving it put you back on Explore — the arrow above a trip means
            "out of this trip", and out of a trip is the list of them (#302). */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="All trips"
          onPress={() => router.navigate("/trips")}
        >
          <BackArrow color={c.ink} />
        </Pressable>
        {/* The name is the control. A trip is named once and renamed rarely,
            so a labelled field parked at the foot of Overview was a permanent
            form for an occasional job — and it printed the name a second time
            to do it (#126, #302). Tapping the title is the whole affordance. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Rename ${title}`}
          onPress={onEditName}
          style={{ flex: 1 }}
        >
          <Text
            numberOfLines={1}
            style={{
              color: c.ink,
              fontFamily: fonts.display,
              fontSize: size.heading,
              fontWeight: "600",
            }}
          >
            {title}
          </Text>
        </Pressable>
        {balance !== null ? (
          <BalanceChip
            text={balance}
            tone={owing ? "blush" : "mint"}
            onPress={() => onGo("money")}
          />
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: space.lg, gap: space.lg }}
      >
        {sections.map((section) => {
          const on = section.route === current;
          return (
            <Pressable
              key={section.route}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => onGo(section.route)}
              style={{
                paddingBottom: space.md,
                borderBottomWidth: 2,
                borderBottomColor: on ? c.pen : "transparent",
              }}
            >
              <Text
                style={{
                  color: on ? c.ink : c["ink-2"],
                  fontFamily: fonts.sans,
                  fontSize: size.body,
                  fontWeight: on ? "600" : "400",
                }}
              >
                {section.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
