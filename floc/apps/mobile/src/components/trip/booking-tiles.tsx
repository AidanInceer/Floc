/**
 * Get booking, on Overview — the web's `overview-booking.tsx`. Only the way in:
 * dates, places and site links live on the Dates screen.
 */
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { BedGlyph, PlaneGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { Body } from "../system/ui";
import { radius, space } from "@/lib/theme";

export function BookingTiles({ onOpen }: { onOpen: () => void }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: space.sm }}>
      <Tile label="Flights" ground={c.peri} onPress={onOpen} icon={<PlaneGlyph color={c["peri-ink"]} />} />
      <Tile label="Stays" ground={c.blush} onPress={onOpen} icon={<BedGlyph color={c["blush-ink"]} />} />
    </View>
  );
}

function Tile({
  label,
  ground,
  icon,
  onPress,
}: {
  label: string;
  ground: string;
  icon: ReactNode;
  onPress: () => void;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Book ${label.toLowerCase()}`}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        gap: space.sm,
        padding: space.md,
        borderRadius: radius.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: c.rule,
        backgroundColor: pressed ? c["sheet-2"] : c.sheet,
      })}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: radius.sm,
          backgroundColor: ground,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>
      <Body bold>{label}</Body>
    </Pressable>
  );
}
