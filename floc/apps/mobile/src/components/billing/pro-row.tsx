/** The web's gold row in the account menu: what you are on, and the way to change it. */
import type { BillingStatus } from "@floc/api/port";
import { Pressable, StyleSheet, Text } from "react-native";

import { DrawerChevron } from "../system/drawer";
import { ProStarGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { proView } from "@/lib/billing/pro";
import { fonts, radius, size, space } from "@/lib/theme";

export function ProRow({ status, onPress }: { status: BillingStatus | undefined; onPress: () => void }) {
  const { c } = useTheme();
  if (!status || proView(status).kind !== "pro") return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Floc Pro"
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        paddingVertical: space.md,
        paddingHorizontal: space.lg,
        backgroundColor: c.pro,
        borderColor: c["pro-edge"],
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.lg,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <ProStarGlyph color={c["pro-gold"]} />
      <Text style={{ flex: 1, color: c["pro-ink"], fontFamily: fonts.sansBold, fontSize: size.body }}>
        Floc Pro
      </Text>
      <DrawerChevron color={c["pro-ink"]} point="down" />
    </Pressable>
  );
}
