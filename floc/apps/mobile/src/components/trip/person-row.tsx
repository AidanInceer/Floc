/**
 * One person, with whatever this screen lets you do about them (ticket 18).
 *
 * ONE ROW, THREE SCREENS. Friends, the invite picker and a roster all draw the
 * same thing — a face, a name, and nought to two small actions — so they draw
 * it from here rather than each inventing its own spacing.
 *
 * THE FACE IS INITIALS UNLESS THERE IS A PICTURE. A missing picture is the
 * ordinary case, not a failure, so it has a real answer rather than a
 * placeholder that looks broken.
 */
import type { ReactNode } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../system/theme";
import { Body } from "../system/ui";
import { fonts, radius, size, space } from "@/lib/theme";
import { initials } from "@floc/core/people/initials";

export function Face({ name, avatarIcon, size: box = 36 }: {
  name: string;
  avatarIcon: string | null;
  size?: number;
}) {
  const { c } = useTheme();
  return avatarIcon ? (
    <Image
      accessibilityIgnoresInvertColors
      source={{ uri: avatarIcon }}
      style={{ width: box, height: box, borderRadius: radius.pill }}
    />
  ) : (
    <View
      style={{
        width: box,
        height: box,
        borderRadius: radius.pill,
        backgroundColor: c["pastel-blue"],
        borderColor: c["pastel-blue-edge"],
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: c["pastel-blue-ink"],
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
  avatarIcon,
  caption,
  children,
}: {
  name: string;
  avatarIcon: string | null;
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
        borderRadius: radius.md,
        paddingVertical: space.sm,
        paddingHorizontal: space.md,
      }}
    >
      <Face name={name} avatarIcon={avatarIcon} />
      <View style={{ flex: 1, gap: space.xs }}>
        <Body bold>{name}</Body>
        {caption ? <Body tone="ink-3">{caption}</Body> : null}
      </View>
      {children}
    </View>
  );
}
