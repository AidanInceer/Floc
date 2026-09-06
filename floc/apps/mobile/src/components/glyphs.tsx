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
