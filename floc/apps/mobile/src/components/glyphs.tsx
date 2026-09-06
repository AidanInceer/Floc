/**
 * Roster seats, drawn (tickets 291, 299).
 *
 * NO EMOJI (#148). The web app draws line-art in a 14×14 `viewBox` at ~13px,
 * `fill="none"`, `strokeWidth` 1.15–1.25, `stroke="currentColor"`. React Native
 * has no SVG without another dependency, so this is the same drawing built
 * from views, at the same weight.
 *
 * The tab glyphs that lived here went with the tab bar (#299) — the section
 * sheet is a list of words, and a word needs no icon beside it.
*/
import { StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

/** A member's seat colour as a filled disc with their initial — the roster's `whoTone` made visible. */
export function Seat({
  initial,
  ground,
  ink,
}: {
  initial: string;
  ground: string;
  ink: string;
}) {
  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: ground,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: ink,
      }}
    >
      <Text style={{ color: ink, fontSize: 12, fontWeight: "600" }}>{initial}</Text>
    </View>
  );
}

/* Real SVG now that `react-native-svg` is here (#302) — same weights as the web. */

const STROKE = 1.2;

/** A tick. Packed, done, claimed. */
export function TickGlyph({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 14 14" fill="none">
      <Path
        d="M2.6 7.4 5.6 10.4 11.4 4"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** A cross. Remove, drop, undo a claim. */
export function CrossGlyph({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 14 14" fill="none">
      <Path d="M3.6 3.6 10.4 10.4" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Path d="M10.4 3.6 3.6 10.4" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    </Svg>
  );
}

/** A hand raised: I'll bring it. A circle with a line up out of it. */
export function ClaimGlyph({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 14 14" fill="none">
      <Path d="M7 10.6V3.4" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Path d="M4.2 6.2 7 3.4 9.8 6.2" stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** A plus. One more of something. */
export function PlusGlyph({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 14 14" fill="none">
      <Path d="M7 3.2V10.8" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Path d="M3.2 7H10.8" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    </Svg>
  );
}

/** A minus. One fewer. */
export function MinusGlyph({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 14 14" fill="none">
      <Path d="M3.2 7H10.8" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    </Svg>
  );
}

/** A chevron pointing down: "this opens". */
export function ChevronGlyph({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 14 14" fill="none">
      <Path d="M3.4 5.4 7 9l3.6-3.6" stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
