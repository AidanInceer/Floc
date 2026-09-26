/**
 * The question a trip leaves behind when you are no longer on it (ticket 95).
 *
 * ASKED ONCE, AND ONLY HERE. A trip's countries stop being derived the moment
 * the membership ends, so this is the last moment they can be kept. An admin
 * deleting or archiving a trip never raises it — nobody answers this for
 * somebody else.
 *
 * NAMED, NOT COUNTED. "Keep 3 countries?" is not a question anyone can answer;
 * the countries are listed with what each was marked as.
 */
import { countryName } from "@floc/core/people/countries";
import { StyleSheet, View } from "react-native";

import { useTheme } from "../system/theme";
import { Body, Button } from "../system/ui";
import { radius, space } from "@/lib/theme";

export type MapPrompt = {
  tripId: number;
  tripName: string;
  countries: { code: string; state: "green" | "yellow" }[];
};

export function MapPromptCard({
  prompt,
  busy,
  onAnswer,
}: {
  prompt: MapPrompt;
  busy: boolean;
  onAnswer: (keep: boolean) => void;
}) {
  const { c } = useTheme();

  return (
    <View
      style={{
        backgroundColor: c["pastel-blue"],
        borderColor: c["pastel-blue-edge"],
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.lg,
        padding: space.lg,
        gap: space.md,
      }}
    >
      <Body bold>Keep the countries from {prompt.tripName}?</Body>
      <Body tone="ink-2">
        {prompt.countries
          .map(
            (country) =>
              `${countryName(country.code)} (${
                country.state === "green" ? "been there" : "want to go"
              })`,
          )
          .join(", ")}
      </Body>
      <View style={{ flexDirection: "row", gap: space.sm }}>
        <View style={{ flex: 1 }}>
          <Button label="Keep them" busy={busy} onPress={() => onAnswer(true)} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="Drop them" variant="quiet" disabled={busy} onPress={() => onAnswer(false)} />
        </View>
      </View>
    </View>
  );
}
