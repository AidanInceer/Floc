/**
 * One person, with whatever this screen lets you do about them (ticket 18).
 *
 * ONE ROW, THREE SCREENS. Friends, the invite picker and a roster all draw the
 * same thing — a face, a name, and nought to two small actions — so they draw
 * it from here rather than each inventing its own spacing.
 *
 * THE FACE IS ALWAYS INITIALS, in a rounded square — the same as the web.
 */
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
  /** What the row has to say that the name cannot — how you met, say. */
  caption?: string | null;
  /** The actions, if this screen has any. */
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
