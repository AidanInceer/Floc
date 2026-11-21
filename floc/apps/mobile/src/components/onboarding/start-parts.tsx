import { START_PLACE_LENGTH, START_PLACES_CAP } from "@floc/core/trip/start/start-steps";
import { useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { CrossGlyph, PlusGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { Body, Button, Field, Heading } from "../system/ui";
import { fonts, radius, size, space } from "@/lib/theme";

export function StepDots({ of, at }: { of: number; at: number }) {
  const { c } = useTheme();
  return (
    <View accessibilityLabel={`Step ${at + 1} of ${of}`} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      {Array.from({ length: of }, (_, i) => (
        <View key={i} style={{ width: i === at ? 16 : 6, height: 6, borderRadius: radius.pill, backgroundColor: i <= at ? c.pen : c["rule-2"] }} />
      ))}
    </View>
  );
}

export function StepTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <View style={{ gap: space.xs, alignItems: "center" }}>
      <Heading>{title}</Heading>
      {sub ? <Body tone="ink-2">{sub}</Body> : null}
    </View>
  );
}

export function StepFooter({ left, right, dots }: { left: ReactNode; right: ReactNode; dots?: { of: number; at: number } }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, paddingHorizontal: space.lg, paddingTop: space.md }}>
      <View style={{ flex: 1, flexDirection: "row", justifyContent: "flex-start" }}>{left}</View>
      {dots ? <StepDots of={dots.of} at={dots.at} /> : null}
      <View style={{ flex: 1, flexDirection: "row", justifyContent: "flex-end" }}>{right}</View>
    </View>
  );
}

function Half({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={{ flex: 1, minHeight: 40, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, backgroundColor: on ? c.sheet : "transparent" }}
    >
      <Text style={{ fontFamily: fonts.sans, fontSize: size.body, color: on ? c.ink : c["ink-2"] }}>{label}</Text>
    </Pressable>
  );
}

export function AskRow({ question, value, onAnswer }: { question: string; value: boolean | null; onAnswer: (v: boolean | null) => void }) {
  const { c } = useTheme();
  const press = (next: boolean) => onAnswer(value === next ? null : next);
  return (
    <View style={{ gap: space.sm, padding: space.md, borderRadius: radius.sm, borderWidth: 1, borderColor: c.rule, backgroundColor: c.sheet }}>
      <Body>{question}</Body>
      <View accessibilityLabel={question} style={{ flexDirection: "row", gap: 2, padding: 3, borderRadius: radius.md, backgroundColor: c["sheet-3"] }}>
        <Half label="Yes" on={value === true} onPress={() => press(true)} />
        <Half label="Not yet" on={value === false} onPress={() => press(false)} />
      </View>
    </View>
  );
}

export function PlacesField({ places, onChange }: { places: string[]; onChange: (p: string[]) => void }) {
  const { c } = useTheme();
  const [text, setText] = useState("");
  const add = () => {
    const place = text.trim();
    setText("");
    if (!place || places.length >= START_PLACES_CAP || places.some((p) => p.toLowerCase() === place.toLowerCase())) return;
    onChange([...places, place]);
  };
  return (
    <View style={{ gap: space.sm }}>
      {places.map((place, i) => (
        <View key={place} style={{ flexDirection: "row", alignItems: "center", gap: space.sm, paddingLeft: space.md, borderRadius: radius.sm, backgroundColor: c["pen-2"] }}>
          <Text style={{ fontFamily: fonts.type, fontSize: size.label, color: c["pen-deep"] }}>{i + 1}</Text>
          <Text style={{ flex: 1, fontFamily: fonts.sans, fontSize: size.body, color: c["pen-deep"] }}>{place}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${place}`} onPress={() => onChange(places.filter((p) => p !== place))} style={{ padding: space.md }}>
            <CrossGlyph color={c["pen-deep"]} />
          </Pressable>
        </View>
      ))}
      {places.length < START_PLACES_CAP ? (
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: space.sm }}>
          <View style={{ flex: 1 }}>
            <Field label={places.length ? "Add another place" : "Place"} value={text} onChangeText={setText} maxLength={START_PLACE_LENGTH} onSubmitEditing={add} returnKeyType="done" />
          </View>
          <View><Button label="Add" fit="small" variant="quiet" icon={(ink) => <PlusGlyph color={ink} />} disabled={!text.trim()} onPress={add} /></View>
        </View>
      ) : null}
    </View>
  );
}

export function SummaryRows({ rows }: { rows: [string, ReactNode][] }) {
  const { c } = useTheme();
  return (
    <View style={{ borderRadius: radius.md, borderWidth: 1, borderColor: c.rule, backgroundColor: c["sheet-2"], paddingHorizontal: space.md }}>
      {rows.map(([label, value], i) => (
        <View key={label} style={{ flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: space.sm, borderTopWidth: i ? 1 : 0, borderTopColor: c.rule }}>
          <Text style={{ width: 56, fontFamily: fonts.type, fontSize: size.label, color: c["ink-3"], textTransform: "uppercase" }}>{label}</Text>
          <View style={{ flex: 1 }}>{typeof value === "string" ? (label === "When" ? <Text style={{ fontFamily: fonts.type, fontSize: size.small, color: c.ink }}>{value}</Text> : <Body>{value}</Body>) : value}</View>
        </View>
      ))}
    </View>
  );
}
