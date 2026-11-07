// The web Overview's legs, cut back: one row per stop, where you sleep, and how you get to the next.
import { formatDate } from "@floc/core/dates/dates";
import { nightsLabel } from "@floc/core/itinerary/stops";
import { hopLabel, type Leg, type LegFile } from "@floc/core/trip/overview/legs";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../system/theme";
import { BedGlyph, RibbonGlyph } from "../system/glyphs";
import { TravelModeGlyph } from "../system/travel-mode-glyph";
import { fonts, radius, size, space } from "@/lib/theme";

type Named = LegFile & { name: string };

export function LegList({ legs, onOpen }: { legs: Leg<Named>[]; onOpen: (date: string) => void }) {
  const { c } = useTheme();
  return (
    <View style={{ backgroundColor: c.sheet, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: c.rule, paddingVertical: space.xs }}>
      {legs.map((leg) => (
        <View key={leg.days[0].dayId}>
          {leg.no > 1 ? <Hop leg={leg} /> : null}
          <LegRow leg={leg} onOpen={onOpen} />
        </View>
      ))}
    </View>
  );
}

function Hop({ leg }: { leg: Leg<Named> }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginLeft: 26, paddingVertical: space.xs, borderLeftWidth: 2, borderLeftColor: c["rule-2"], borderStyle: "dashed", paddingLeft: space.md }}>
      {leg.mode ? <TravelModeGlyph mode={leg.mode} color={c["ink-2"]} size={14} /> : null}
      <Text style={{ color: c["ink-2"], fontFamily: fonts.sans, fontSize: size.small }}>
        {`${hopLabel(leg.mode, leg.placeName)} · ${formatDate(leg.arrive)}`}
      </Text>
    </View>
  );
}

function LegRow({ leg, onOpen }: { leg: Leg<Named>; onOpen: (date: string) => void }) {
  const { c } = useTheme();
  const others = leg.files.length - (leg.stay ? 1 : 0);
  return (
    <Pressable
      testID={`leg-${leg.no}`}
      accessibilityRole="link"
      accessibilityLabel={`Stop ${leg.no}, ${leg.placeName}, ${nightsLabel(leg.nights)}`}
      onPress={() => onOpen(leg.arrive)}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        paddingVertical: space.sm,
        paddingHorizontal: space.lg,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      {leg.stay ? (
        <View accessible accessibilityLabel={`Booked: ${leg.stay.name}`} style={{ position: "absolute", top: -1, right: space.lg }}>
          <RibbonGlyph color={c["pastel-green-ink"]} />
        </View>
      ) : null}
      {/* Same ring and number as the map's pin — one stop drawn twice. */}
      <View style={{ width: 24, height: 24, borderRadius: radius.pill, borderWidth: 2, borderColor: c.pen, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: c.pen, fontFamily: fonts.typeBold, fontSize: 11 }}>{leg.no}</Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: c.ink, fontFamily: fonts.sansBold, fontSize: size.body }}>{leg.placeName}</Text>
        <Text style={{ color: c["ink-2"], fontFamily: fonts.type, fontSize: size.label }}>
          {`${formatDate(leg.arrive)} – ${formatDate(leg.leave)} · ${nightsLabel(leg.nights)}`}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: space.sm }}>
          {leg.stay ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
              <BedGlyph color={c["pastel-green-ink"]} />
              <Text numberOfLines={1} style={{ color: c.ink, fontFamily: fonts.sans, fontSize: size.small }}>
                {leg.stay.name}
              </Text>
            </View>
          ) : null}
          {others > 0 ? (
            <Text style={{ color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.small }}>
              {`${others} ${others === 1 ? "file" : "files"}`}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
