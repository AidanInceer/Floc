/**
 * The tab icons (ticket 291).
 *
 * NO EMOJI (#148). The web app draws line-art in a 14×14 `viewBox` at ~13px,
 * `fill="none"`, `strokeWidth` 1.15–1.25, `stroke="currentColor"`. React Native
 * has no SVG without another dependency, so these are the same drawings built
 * from views — a hairline box, a rule, a stack of lines — at the same weight.
 *
 * They are decoration: every tab carries its word underneath, so nothing here
 * is the only way to tell one tab from another.
 */
import { StyleSheet, Text, View, type ColorValue } from "react-native";

const BOX = 18;
const STROKE = 1.25;

type Glyph = "overview" | "dates" | "itinerary" | "money" | "roster";

function Line({ color, width, top }: { color: ColorValue; width: number; top: number }) {
  return (
    <View
      style={{
        position: "absolute",
        top,
        left: 2,
        width,
        height: STROKE,
        backgroundColor: color,
      }}
    />
  );
}

export function TabGlyph({ name, color }: { name: Glyph; color: ColorValue }) {
  const frame = {
    width: BOX,
    height: BOX,
    borderColor: color,
    borderWidth: STROKE,
    borderRadius: 3,
  } as const;

  // Overview is the whole sheet; dates is a calendar — the sheet with its
  // header rule; itinerary is the sheet ruled into days; money is a sheet with
  // one figure on it; roster is two overlapping people.
  switch (name) {
    case "overview":
      return <View style={frame} />;
    case "dates":
      return (
        <View style={frame}>
          <Line color={color} width={BOX - 4} top={3} />
        </View>
      );
    case "itinerary":
      return (
        <View style={frame}>
          <Line color={color} width={BOX - 8} top={3} />
          <Line color={color} width={BOX - 8} top={7} />
          <Line color={color} width={BOX - 12} top={11} />
        </View>
      );
    case "money":
      return (
        <View style={[frame, { alignItems: "center", justifyContent: "center" }]}>
          <View
            style={{
              width: STROKE,
              height: BOX - 8,
              backgroundColor: color,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: 4,
              width: BOX - 9,
              height: STROKE,
              backgroundColor: color,
            }}
          />
        </View>
      );
    case "roster":
      return (
        <View style={{ width: BOX, height: BOX, justifyContent: "center" }}>
          <View
            style={{
              width: BOX - 7,
              height: BOX - 7,
              borderRadius: (BOX - 7) / 2,
              borderColor: color,
              borderWidth: STROKE,
            }}
          />
          <View
            style={{
              position: "absolute",
              right: 0,
              width: BOX - 7,
              height: BOX - 7,
              borderRadius: (BOX - 7) / 2,
              borderColor: color,
              borderWidth: STROKE,
            }}
          />
        </View>
      );
  }
}

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
