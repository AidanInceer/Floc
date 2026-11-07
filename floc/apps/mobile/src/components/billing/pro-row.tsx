/** Why for everyone: the row showed only to Pro members, so a Free member had no way to find the offer from You. */
import type { BillingStatus } from "@floc/api/port";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { DrawerChevron } from "../system/drawer";
import { useTheme } from "../system/theme";
import { proView } from "@/lib/billing/pro";
import { fonts, radius, size, space } from "@/lib/theme";

export function ProRow({ status, onPress }: { status: BillingStatus | undefined; onPress: () => void }) {
  const { c } = useTheme();
  if (!status) return null;
  const view = proView(status);
  if (view.kind === "hidden") return null;
  const pro = view.kind === "pro";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={pro ? "Floc Pro, you're on Pro" : "Floc Pro, see what it adds"}
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
        borderRadius: radius.md,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: c["pro-ink"], fontFamily: fonts.sansBold, fontSize: size.body }}>Floc Pro</Text>
        <Text style={{ color: c["pro-ink"], fontFamily: fonts.sans, fontSize: size.small }}>
          {pro ? "You're on Pro" : "Weather, auto packing and filled-in searches"}
        </Text>
      </View>
      <View style={{ transform: [{ rotate: "-90deg" }] }}>
        <DrawerChevron color={c["pro-ink"]} point="down" />
      </View>
    </Pressable>
  );
}
