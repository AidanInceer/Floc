import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { useTheme } from "../system/theme";
import { Body } from "../system/ui";
import { radius, space } from "@/lib/theme";
import { Face } from "../system/face";

export function PersonRow({
  name,
  caption,
  children,
}: {
  name: string;
  caption?: string | null;
  children?: ReactNode;
}) {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        backgroundColor: c.sheet,
        borderColor: c.rule,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.sm,
        paddingVertical: space.sm,
        paddingHorizontal: space.md,
      }}
    >
      <Face name={name} />
      <View style={{ flex: 1, gap: space.xs }}>
        <Body bold>{name}</Body>
        {caption ? <Body tone="ink-3">{caption}</Body> : null}
      </View>
      {children}
    </View>
  );
}
