/**
 * Why: five screens drew their own face; this is the phone's one renderer, and each `look` keeps its screen's size and edge.
 */
import { initials } from "@floc/core/people/initials";
import { whoTone, type WhoTone } from "@floc/core/people/who";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "./theme";
import { fonts, radius, size as type } from "@/lib/theme";

export type FaceLook = "row" | "profile" | "seat" | "presence" | "stack";

const BOX: Record<FaceLook, number> = { row: 36, profile: 60, seat: 28, presence: 22, stack: 26 };

function lettering(look: FaceLook): { fontFamily: string; fontSize: number } {
  switch (look) {
    case "row":
      return { fontFamily: fonts.display, fontSize: type.small };
    case "profile":
      return { fontFamily: fonts.display, fontSize: type.heading };
    case "seat":
      return { fontFamily: fonts.sansBold, fontSize: type.label };
    case "presence":
    case "stack":
      return { fontFamily: fonts.typeBold, fontSize: type.label };
  }
}

export function Face({ name, tone = whoTone(name), look = "row", size }: {
  name: string;
  tone?: WhoTone;
  look?: FaceLook;
  size?: number;
}) {
  const { c } = useTheme();
  const box = size ?? BOX[look];
  // Why: a stack's faces overlap, so each wears a ring of the sheet to stay apart; a row's edge matches its fill.
  const edge =
    look === "stack"
      ? { borderWidth: 1.5, borderColor: c.sheet }
      : { borderWidth: StyleSheet.hairlineWidth, borderColor: look === "row" ? c[tone] : c[`${tone}-ink`] };
  return (
    <View
      style={{
        width: box,
        height: box,
        borderRadius: radius.sm,
        backgroundColor: c[tone],
        alignItems: "center",
        justifyContent: "center",
        ...edge,
      }}
    >
      <Text numberOfLines={1} maxFontSizeMultiplier={1} style={{ color: c[`${tone}-ink`], ...lettering(look) }}>
        {initials(name)}
      </Text>
    </View>
  );
}
