import type { WhoTone } from "@floc/core/people/who";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "./theme";
import { fonts, radius, size } from "@/lib/theme";
import { Face as FaceSquare } from "./face";
import { faceOverlap } from "@floc/core/people/faces/face-overlap";

export type Face = { userId: string; name: string; tone: string };

const SHOWN = 5;

/** Overlapping faces, the web card's avatar row. Past five, a count says how many more. */
export function FaceStack({ faces, diameter = 26, label }: { faces: Face[]; diameter?: number; label?: string }) {
  const { c } = useTheme();
  if (faces.length === 0) return null;
  const shown = faces.slice(0, SHOWN);
  const more = faces.length - shown.length;
  const overlap = faceOverlap(diameter);
  const ring = { width: diameter, height: diameter, borderRadius: radius.sm, borderWidth: 1.5, borderColor: c.sheet };
  return (
    <View
      accessible
      accessibilityLabel={label ?? `${faces.length} going: ${faces.map((f) => f.name).join(", ")}`}
      style={{ flexDirection: "row", alignItems: "center" }}
    >
      {shown.map((face, i) => (
        <View key={face.userId} style={{ marginLeft: i === 0 ? 0 : overlap }}>
          <FaceSquare name={face.name} tone={face.tone as WhoTone} look="stack" size={diameter} />
        </View>
      ))}
      {more > 0 ? (
        <View
          style={[ring, { marginLeft: overlap, backgroundColor: c["sheet-2"], alignItems: "center", justifyContent: "center", borderColor: c.sheet }]}
        >
          <Text style={{ color: c["ink-2"], fontFamily: fonts.type, fontSize: size.label }}>{`+${more}`}</Text>
        </View>
      ) : null}
      <View style={{ width: StyleSheet.hairlineWidth }} />
    </View>
  );
}
