/**
 * Why: the wordmark, drawn natively (#no-ticket; the web's `wordmark.tsx`).
 *
 * THE SAME MARK, NOT A SIMILAR ONE. Three chevrons in a V — the flock, and the
 * "who's coming" of a trip — then the display face lowercase with the one pen
 * dot that carries through the product as "yours". Same 28×22 viewBox and the
 * same three paths as the browser draws, so the two surfaces cannot drift.
 *
 * IT IS THE BIGGEST THING ON THE SIGN-IN SCREEN, a third over the browser's
 * size. On a phone the header is the whole top of the screen rather than one
 * end of a bar, so the mark at the web's 22px read as a caption.
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
      <Svg width={33} height={26} viewBox="0 0 28 22" fill="none">
        <Path
          d="M3.4 16.5 7 12.9 10.6 16.5"
          stroke={c.pen}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M10.4 10 14 6.4 17.6 10"
          stroke={c.pen}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M17.4 16.5 21 12.9 24.6 16.5"
          stroke={c.pen}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <Text
        style={{
          color: c.ink,
          fontFamily: fonts.display,
          fontSize: 29,
          letterSpacing: -0.3,
        }}
      >
        floc<Text style={{ color: c.pen }}>.</Text>
      </Text>
    </View>
  );
}
