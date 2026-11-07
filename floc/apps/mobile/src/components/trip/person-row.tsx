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
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../system/theme";
import { Body } from "../system/ui";
import { fonts, radius, size, space } from "@/lib/theme";
import { whoTone, type WhoTone } from "@floc/core/people/who";
import { initials } from "@floc/core/people/initials";

export function Face({ name, tone = whoTone(name), size: box = 36 }: {
  name: string;
  tone?: WhoTone;
  size?: number;
}) {
  const { c } = useTheme();
  return (
    <View
      style={{
        width: box,
        height: box,
        borderRadius: radius.sm,
        backgroundColor: c[tone],
        borderColor: c[tone],
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: c[`${tone}-ink`],
          fontFamily: fonts.display,
          fontSize: size.small,
        }}
      >
        {initials(name)}
      </Text>
    </View>
  );
}

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
