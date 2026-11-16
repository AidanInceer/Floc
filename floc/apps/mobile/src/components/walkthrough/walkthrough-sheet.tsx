import {
  chipsFor,
  sortedAtStart,
  thenLine,
  walkthroughSteps,
  welcomeLine,
  type Sorted,
  type WalkthroughStep,
} from "@floc/core/trip/walkthrough";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { StepGlyph, TickGlyph } from "../system/glyphs";
import { Sheet } from "../system/sheet";
import { useTheme } from "../system/theme";
import { Body, Button } from "../system/ui";
import { fonts, radius, size, space } from "@/lib/theme";

const WASH = {
  ideas: ["pastel-blue", "pastel-blue-ink"],
  invite: ["pen-2", "pen-deep"],
  dates: ["pastel-yellow", "pastel-yellow-ink"],
} as const;

export type TripFacts = { name: string; joined: boolean; datesSet: boolean; placesSet: boolean };

export function WalkthroughSheet({ trip, firstName, onGo, onClose }: {
  trip: TripFacts;
  firstName: string;
  onGo: (step: WalkthroughStep) => void;
  onClose: () => void;
}) {
  const { c } = useTheme();
  const [sorted, setSorted] = useState<Sorted>(() => sortedAtStart(trip));
  const steps = walkthroughSteps(sorted, trip.joined);
  const start = steps[0] as WalkthroughStep;
  const [ground, ink] = WASH[start.key as keyof typeof WASH] ?? WASH.ideas;

  return (
    <Sheet open onClose={onClose}>
      <View style={{ paddingHorizontal: space.lg, gap: space.md }}>
        <View style={{ gap: space.xs }}>
          <Text style={{ fontFamily: fonts.type, fontSize: 12, color: c["ink-3"] }} numberOfLines={1}>{trip.name}</Text>
          <Text style={{ fontFamily: fonts.display, fontSize: 22, color: c.ink }}>Welcome to Floc, {firstName}.</Text>
          <Body tone="ink-2">{welcomeLine(trip.name, trip.joined)}</Body>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm - 2 }}>
          {chipsFor(trip.joined).map((chip) => {
            const on = sorted[chip.key];
            const color = on ? c["pastel-green-ink"] : c["ink-2"];
            return (
              <Pressable
                key={chip.key}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => setSorted((s) => ({ ...s, [chip.key]: !s[chip.key] }))}
                style={{
                  minHeight: 44,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  borderRadius: radius.pill,
                  borderWidth: 1,
                  borderColor: on ? c["pastel-green-edge"] : c["rule-2"],
                  backgroundColor: on ? c["pastel-green"] : c.sheet,
                  paddingLeft: 10,
                  paddingRight: space.md,
                }}
              >
                {on ? <TickGlyph color={color} /> : <StepGlyph step={chip.key} color={color} />}
                <Text style={{ fontFamily: fonts.sans, fontSize: size.small, color }}>{chip.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View accessibilityLiveRegion="polite" style={{ flexDirection: "row", gap: space.md, alignItems: "center", backgroundColor: c[ground], borderRadius: radius.md, padding: space.md }}>
          <View style={{ width: 34, height: 34, borderRadius: radius.sm, backgroundColor: c.sheet, alignItems: "center", justifyContent: "center" }}>
            <StepGlyph step={start.key} color={c[ink]} size={16} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "baseline", columnGap: space.sm }}>
              <Text style={{ fontFamily: fonts.sansBold, fontSize: size.body, color: c[ink] }}>{start.title}</Text>
              <Text style={{ fontFamily: fonts.type, fontSize: size.label, color: c[ink] }}>Start here</Text>
            </View>
            <Text style={{ fontFamily: fonts.sans, fontSize: size.small, color: c[ink] }}>{start.line}</Text>
          </View>
        </View>
        {steps.length > 1 ? <Text style={{ fontFamily: fonts.sans, fontSize: size.small, color: c["ink-2"] }}>{thenLine(steps)}</Text> : null}

        <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, paddingTop: space.xs }}>
          <Button label="Skip" variant="quiet" fit="small" onPress={onClose} />
          <View style={{ flex: 1 }} />
          <Button label={`Go to ${start.place}`} fit="small" onPress={() => onGo(start)} />
        </View>
      </View>
    </Sheet>
  );
}
