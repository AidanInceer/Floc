/** The group card's foot: what has been spent, as the web's Overview draws it. */
import { spendNote, type SpendHeadline } from "@floc/core/money/spend";
import { formatMoney } from "@floc/core/money/money";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "../system/theme";
import { fonts, radius, size, space } from "@/lib/theme";

export function SpendingStrip({
  headline,
  count,
  onPress,
}: {
  headline: SpendHeadline | null;
  count: number;
  onPress: () => void;
}) {
  const { c } = useTheme();
  const ink = c["mint-ink"];
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel="Spending, open Money"
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: space.md,
        padding: space.md,
        borderRadius: radius.md,
        backgroundColor: c.mint,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View style={{ flexShrink: 1 }}>
        <Text style={{ color: ink, fontFamily: fonts.display, fontSize: size.body }}>Spending</Text>
        <Text style={{ color: ink, fontFamily: fonts.sans, fontSize: size.small }}>
          {spendNote(count, headline)}
        </Text>
      </View>
      <Text
        style={{ color: ink, fontFamily: fonts.displayBold, fontSize: size.heading, fontVariant: ["tabular-nums"] }}
      >
        {headline ? formatMoney(headline.total, headline.currency) : "—"}
      </Text>
    </Pressable>
  );
}
