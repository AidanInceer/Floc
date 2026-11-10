import { addMonths, formatMonth, type IsoMonth } from "@floc/core/dates/availability";
import { Text, View } from "react-native";

import { ChevronGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { IconButton } from "../system/ui";
import { fonts, size, space } from "@/lib/theme";

/** The month, with a square step either side — a rounded-square control, never a text "‹" in an oval. */
export function MonthNav({ month, onChange, min }: { month: IsoMonth; onChange: (month: IsoMonth) => void; min?: IsoMonth }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
      <IconButton label="Previous month" disabled={min !== undefined && month <= min} onPress={() => onChange(addMonths(month, -1))}>
        {(ink) => (
          <View style={{ transform: [{ rotate: "90deg" }] }}>
            <ChevronGlyph color={ink} />
          </View>
        )}
      </IconButton>
      <Text style={{ flex: 1, textAlign: "center", color: c.ink, fontFamily: fonts.sansBold, fontSize: size.body }}>
        {formatMonth(month)}
      </Text>
      <IconButton label="Next month" onPress={() => onChange(addMonths(month, 1))}>
        {(ink) => (
          <View style={{ transform: [{ rotate: "-90deg" }] }}>
            <ChevronGlyph color={ink} />
          </View>
        )}
      </IconButton>
    </View>
  );
}
