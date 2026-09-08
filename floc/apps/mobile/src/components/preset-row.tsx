/**
 * One listing, as a row you can take in at a glance (direction C).
 *
 * A ROW, NOT A CARD. Explore used to sell every listing in full, ten times
 * over — title, price line, a sentence, the leg chain, a badge and a button
 * each. Ten pitches stacked is not ten choices, it is a wall. The row carries
 * only what picks one *out* of ten: where, how long, how you move, and the
 * number that rules half of them out. The pitch happens once, on the listing
 * you opened.
 *
 * THE GLYPH IS THE MODE, AND THE MODE IS ALSO A WORD. A ferry week and a
 * driving week are different holidays, so the mark earns its place — but it
 * repeats the word beside it rather than replacing it, because a drawing is
 * never the only signal (#204).
 *
 * THE TINT IS THE REGION. Six of ten listings move by car, so the mode glyph
 * alone left the list looking like one repeated mark — it tells you about a
 * listing but does not help you find one. Region is what the eye is sorting by
 * when it scans, and it is the axis the chips above already filter on, so the
 * two agree. Colour is never the only signal: the country is on the row and
 * the region names itself in the chip.
 */
import { formatMoney } from "@floc/core/money";
import type { PresetTrip } from "@floc/core/preset-trips";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "./theme";
import { TravelModeGlyph } from "./travel-mode-glyph";
import { REGION_TINT } from "@/lib/region-tint";
import { fonts, radius, size, space } from "@/lib/theme";

/** How the group moves once it is there — the first hop, or nothing to say. */
export function primaryMode(trip: PresetTrip) {
  return trip.legs.find((leg) => leg.kind === "hop")?.mode ?? "other";
}

export function PresetRow({ trip, onOpen }: { trip: PresetTrip; onOpen: () => void }) {
  const { c } = useTheme();
  const mode = primaryMode(trip);
  const tint = REGION_TINT[trip.region];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${trip.title} — ${trip.country}, ${trip.nights} nights, from ${formatMoney(trip.priceFromMinor, trip.currency)}`}
      onPress={onOpen}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        backgroundColor: c.sheet,
        borderColor: c.rule,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.md,
        padding: space.md,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: radius.md,
          backgroundColor: c[tint.fill],
          borderColor: c[tint.edge],
          borderWidth: StyleSheet.hairlineWidth,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <TravelModeGlyph mode={mode} color={c[tint.ink]} />
      </View>

      <View style={{ flex: 1, gap: space.xs }}>
        <Text
          numberOfLines={1}
          style={{
            color: c.ink,
            fontFamily: fonts.display,
            fontSize: size.body,
            fontWeight: "600",
          }}
        >
          {trip.title}
        </Text>
        <Text
          numberOfLines={1}
          style={{ color: c["ink-2"], fontFamily: fonts.type, fontSize: size.label }}
        >
          {trip.country} · {trip.nights}n · {mode === "other" ? "mixed" : mode}
        </Text>
      </View>

      <View style={{ alignItems: "flex-end", gap: space.xs }}>
        <Text
          style={{
            color: c.ink,
            fontFamily: fonts.type,
            fontSize: size.body,
            fontVariant: ["tabular-nums"],
          }}
        >
          {formatMoney(trip.priceFromMinor, trip.currency)}
        </Text>
        <Text
          style={{
            color: c["ink-3"],
            fontFamily: fonts.type,
            fontSize: size.label,
            textTransform: "uppercase",
            letterSpacing: 0.6,
          }}
        >
          from
        </Text>
      </View>
    </Pressable>
  );
}
