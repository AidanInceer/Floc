import {
  EXPLORE_QUESTIONS,
  NIGHTS,
  type ExploreAnswers,
  type ExploreQuestion,
} from "@floc/core/trip/explore/explore-match";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { NightsSlider } from "./nights-slider";
import { useTheme } from "../system/theme";
import { Figure, Label } from "../system/ui";
import { fonts, radius, size, space } from "@/lib/theme";

const KEYS = Object.keys(EXPLORE_QUESTIONS) as ExploreQuestion[];

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={{
        backgroundColor: on ? c.pen : c.sheet,
        borderColor: on ? c.pen : c.rule,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.pill,
        paddingVertical: space.sm,
        paddingHorizontal: space.md,
      }}
    >
      <Text
        style={{
          color: on ? c.sheet : c["ink-2"],
          fontFamily: on ? fonts.sansBold : fonts.sans,
          fontSize: size.small,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function ExploreQuiz({
  answers,
  onAnswer,
}: {
  answers: ExploreAnswers;
  onAnswer: (next: ExploreAnswers) => void;
}) {
  const nightsLabel = answers.nights >= NIGHTS.max ? "Any length" : `Up to ${answers.nights} nights`;

  return (
    <View style={{ gap: space.md }}>
      {KEYS.map((key) => (
        <View key={key} style={{ gap: space.sm }}>
          <Label>{EXPLORE_QUESTIONS[key].label}</Label>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            {Object.entries(EXPLORE_QUESTIONS[key].options).map(([value, label]) => (
              <Chip
                key={value}
                label={label}
                on={answers[key] === value}
                onPress={() => onAnswer({ ...answers, [key]: value })}
              />
            ))}
          </View>
        </View>
      ))}
      <View style={{ gap: space.xs }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
          <Label>{NIGHTS.label}</Label>
          <Figure>{nightsLabel}</Figure>
        </View>
        <NightsSlider
          value={answers.nights}
          min={NIGHTS.min}
          max={NIGHTS.max}
          label={`${NIGHTS.label}: ${nightsLabel}`}
          onChange={(nights) => onAnswer({ ...answers, nights })}
        />
      </View>
    </View>
  );
}
