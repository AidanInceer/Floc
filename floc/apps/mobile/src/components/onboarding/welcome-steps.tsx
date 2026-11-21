import { airportLabel, countryAirports, loadAirports, searchAirports, type Airport } from "@floc/core/money/estimate/guide/airports/airports";
import { CABINS, CABIN_LABELS, PACES, PACE_LABELS, STAY_LABELS, STAY_STYLES } from "@floc/core/money/estimate/style";
import { VIBE_TAGS } from "@floc/core/trip/vibe-tags";
import { useEffect, useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { TickGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { VibeGlyph } from "../system/vibe-glyph";
import { Body, Button, SearchField } from "../system/ui";
import { fonts, radius, size, space } from "@/lib/theme";

export type Style = { cabin?: string; stay?: string; pace?: string };

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const deviceCountry = (): string | null => /[-_]([A-Z]{2})\b/.exec(Intl.DateTimeFormat().resolvedOptions().locale)?.[1] ?? null;

function Tile({ label, picked, icon, onPress }: { label: string; picked: boolean; icon: (ink: string) => ReactNode; onPress: () => void }) {
  const { c } = useTheme();
  const ink = picked ? c["pen-deep"] : c["ink-2"];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: picked }}
      onPress={onPress}
      style={{ flexGrow: 1, flexBasis: 88, alignItems: "center", gap: 6, paddingTop: space.md, paddingBottom: space.sm, borderRadius: radius.sm, borderWidth: 1, borderColor: c.rule, backgroundColor: c.sheet }}
    >
      <View style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, backgroundColor: picked ? c["pen-2"] : c["sheet-3"] }}>
        {picked ? <TickGlyph color={ink} /> : icon(ink)}
      </View>
      <Text style={{ fontFamily: fonts.sans, fontSize: size.small, color: ink, textAlign: "center" }}>{label}</Text>
    </Pressable>
  );
}

function Word({ label, picked, onPress }: { label: string; picked: boolean; onPress: () => void }) {
  const { c } = useTheme();
  const ink = picked ? c["pen-deep"] : c["ink-2"];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: picked }}
      onPress={onPress}
      style={{ flex: 1, minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingHorizontal: 4, borderRadius: radius.sm, borderWidth: 1, borderColor: c.rule, backgroundColor: picked ? c["pen-2"] : c.sheet }}
    >
      {picked ? <TickGlyph color={ink} /> : null}
      <Text numberOfLines={1} style={{ fontFamily: fonts.sans, fontSize: size.small, color: ink }}>{label}</Text>
    </Pressable>
  );
}

function TileRow({ label, children }: { label: string; children: ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontFamily: fonts.type, fontSize: size.label, color: c["ink-3"], textTransform: "uppercase" }}>{label}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>{children}</View>
    </View>
  );
}

export function StylePicker({ style, onStyle }: { style: Style; onStyle: (update: (s: Style) => Style) => void }) {
  const toggle = (key: keyof Style, value: string) => onStyle((now) => ({ ...now, [key]: now[key] === value ? undefined : value }));
  return (
    <View style={{ gap: space.md }}>
      <TileRow label="Cabin">{CABINS.map((v) => <Word key={v} label={CABIN_LABELS[v]} picked={style.cabin === v} onPress={() => toggle("cabin", v)} />)}</TileRow>
      <TileRow label="Stay">{STAY_STYLES.map((v) => <Word key={v} label={STAY_LABELS[v]} picked={style.stay === v} onPress={() => toggle("stay", v)} />)}</TileRow>
      <TileRow label="Pace">{PACES.map((v) => <Word key={v} label={PACE_LABELS[v]} picked={style.pace === v} onPress={() => toggle("pace", v)} />)}</TileRow>
    </View>
  );
}

export function VibePicker({ vibes, onVibes }: { vibes: string[]; onVibes: (update: (v: string[]) => string[]) => void }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
      {VIBE_TAGS.map((tag) => (
        <Tile key={tag} label={cap(tag)} picked={vibes.includes(tag)} icon={(ink) => <VibeGlyph tag={tag} color={ink} />} onPress={() => onVibes((now) => (now.includes(tag) ? now.filter((v) => v !== tag) : [...now, tag]))} />
      ))}
    </View>
  );
}

export function AirportPicker({ code, onCode }: { code: string | null; onCode: (code: string | null) => void }) {
  const { c } = useTheme();
  const [airports, setAirports] = useState<Airport[]>([]);
  const [text, setText] = useState("");
  useEffect(() => {
    void loadAirports().then(setAirports);
  }, []);
  const chosen = airports.find((a) => a.code === code) ?? null;
  if (code) {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.md, padding: space.md, borderRadius: radius.sm, borderWidth: 1, borderColor: c.rule, backgroundColor: c.sheet }}>
        <Text style={{ fontFamily: fonts.type, fontSize: size.heading, color: c.ink }}>{code}</Text>
        <View style={{ flex: 1 }}><Body>{chosen ? chosen.name : code}</Body></View>
        <Button label="Change" variant="quiet" fit="small" onPress={() => onCode(null)} />
      </View>
    );
  }
  const hits = text.trim() ? searchAirports(airports, text, 5) : countryAirports(airports, deviceCountry());
  return (
    <View style={{ gap: space.sm }}>
      <SearchField label="Home airport" value={text} onChangeText={setText} autoCorrect={false} />
      {hits.map((a) => (
        <Pressable key={a.code} accessibilityRole="button" onPress={() => onCode(a.code)} style={{ paddingVertical: space.sm, paddingHorizontal: space.md, borderRadius: radius.sm, backgroundColor: c.sheet, borderWidth: 1, borderColor: c.rule }}>
          <Body>{airportLabel(a)}</Body>
        </Pressable>
      ))}
    </View>
  );
}
