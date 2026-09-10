/**
 * The region filter above Explore's list (direction C).
 *
 * A FILTER EARNS ITS PLACE ONCE THE LIST IS LONG. #302 said ten listings do
 * not need filtering, and that was true while each one was a card you scrolled
 * past. As rows, ten fit in two screens and the question changes from "what is
 * this" to "where am I looking" — which is what this answers.
 *
 * ONLY REGIONS THAT HAVE SOMETHING. A chip that filters to nothing is a dead
 * control with a reason, and the rule is to not draw it.
 *
 * A CHOSEN CHIP WEARS ITS REGION'S COLOUR. The rows below are already tinted
 * by region, so a chip in one fixed colour would have been a key that does not
 * match its map. Both read `REGION_TINT`. The word is still the signal — the
 * colour only agrees with it.
 */
import { REGIONS, type Region } from "@floc/core/preset-trips";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { useTheme } from "./theme";
import { ALL_TINT, REGION_TINT } from "@/lib/region-tint";
import { fonts, radius, size, space } from "@/lib/theme";

/** Null is "All" — the state the screen opens in. */
export type RegionChoice = Region | null;

export function RegionChips({
  available,
  value,
  onChange,
}: {
  available: readonly Region[];
  value: RegionChoice;
  onChange: (next: RegionChoice) => void;
}) {
  const { c } = useTheme();
  const choices: RegionChoice[] = [null, ...REGIONS.filter((r) => available.includes(r))];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: space.sm, paddingHorizontal: space.lg }}
    >
      {choices.map((choice) => {
        const on = choice === value;
        const tint = choice === null ? ALL_TINT : REGION_TINT[choice];
        return (
          <Pressable
            key={choice ?? "all"}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={choice ?? "All regions"}
            onPress={() => onChange(choice)}
            style={{
              backgroundColor: on ? c[tint.fill] : c.sheet,
              borderColor: on ? c[tint.edge] : c.rule,
              borderWidth: StyleSheet.hairlineWidth,
              borderRadius: radius.pill,
              paddingVertical: space.sm,
              paddingHorizontal: space.md,
            }}
          >
            <Text
              style={{
                color: on ? c[tint.ink] : c["ink-2"],
                fontFamily: on ? fonts.sansBold : fonts.sans,
                fontSize: size.small,
              }}
            >
              {choice ?? "All"}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
