import type { AvatarIcon } from "@floc/core/people/avatar-icon";
import type { WhoTone } from "@floc/core/people/who";
import { StyleSheet, Text, View } from "react-native";

import { AvatarIconMark } from "./avatar-icon";
import { useTheme } from "./theme";
import { fonts, radius, size } from "@/lib/theme";

export type Face = { userId: string; name: string; avatarIcon: AvatarIcon | null; tone: string };

const SHOWN = 5;

/** Overlapping faces, the web card's avatar row. Past five, a count says how many more. */
export function FaceStack({ faces, diameter = 26 }: { faces: Face[]; diameter?: number }) {
  const { c } = useTheme();
  if (faces.length === 0) return null;
  const shown = faces.slice(0, SHOWN);
  const more = faces.length - shown.length;
  const ring = { width: diameter, height: diameter, borderRadius: radius.pill, borderWidth: 1.5, borderColor: c.sheet };
  return (
    <View
      accessible
      accessibilityLabel={`${faces.length} going: ${faces.map((f) => f.name).join(", ")}`}
      style={{ flexDirection: "row", alignItems: "center" }}
    >
      {shown.map((face, i) => {
        const tone = face.tone as WhoTone;
        return (
          <View
            key={face.userId}
            style={[ring, { marginLeft: i === 0 ? 0 : -diameter / 3, backgroundColor: c[tone], alignItems: "center", justifyContent: "center" }]}
          >
            {face.avatarIcon ? (
              <AvatarIconMark icon={face.avatarIcon} color={c[`${tone}-ink`]} size={diameter * 0.55} />
            ) : (
              <Text style={{ color: c[`${tone}-ink`], fontFamily: fonts.sansBold, fontSize: diameter * 0.42 }}>
                {face.name.slice(0, 1).toUpperCase()}
              </Text>
            )}
          </View>
        );
      })}
      {more > 0 ? (
        <View
          style={[ring, { marginLeft: -diameter / 3, backgroundColor: c["sheet-2"], alignItems: "center", justifyContent: "center", borderColor: c.sheet }]}
        >
          <Text style={{ color: c["ink-2"], fontFamily: fonts.type, fontSize: size.label }}>{`+${more}`}</Text>
        </View>
      ) : null}
      <View style={{ width: StyleSheet.hairlineWidth }} />
    </View>
  );
}
