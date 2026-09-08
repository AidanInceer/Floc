/**
 * The wordmark, drawn natively (#no-ticket; the web's `wordmark.tsx`).
 *
 * THE SAME MARK, NOT A SIMILAR ONE. Three chevrons in a V — the flock, and the
 * "who's coming" of a trip — then the display face lowercase with the one pen
 * dot that carries through the product as "yours". Same 26×20 viewBox and the
 * same three paths as the browser draws, so the two surfaces cannot drift.
 *
 * IT REPLACES THE WORD "Floc" IN THE HEADER. A stack title is a label; the
 * first thing somebody sees on opening the app should be the mark itself.
 */
import { Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useTheme } from "./theme";
import { fonts, space } from "@/lib/theme";

export function FlocWordmark() {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
      <Svg width={25} height={20} viewBox="0 0 26 20" fill="none">
        <Path
          d="M3 14 6.5 10.5 10 14"
          stroke={c.pen}
          strokeWidth={1.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M9.5 8.5 13 5 16.5 8.5"
          stroke={c.pen}
          strokeWidth={1.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M16 14 19.5 10.5 23 14"
          stroke={c.pen}
          strokeWidth={1.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <Text
        style={{
          color: c.ink,
          fontFamily: fonts.display,
          fontSize: 22,
          fontWeight: "600",
          letterSpacing: -0.3,
        }}
      >
        floc<Text style={{ color: c.pen }}>.</Text>
      </Text>
    </View>
  );
}
