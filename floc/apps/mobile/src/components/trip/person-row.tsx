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
import { whoTone, type WhoTone } from "@floc/core/people/who";
import { initials } from "@floc/core/people/initials";
import { parseAvatarIcon } from "@floc/core/people/avatar-icon";
import { AvatarIconMark } from "../system/avatar-icon";

export function Face({ name, avatarIcon, tone = whoTone(name), size: box = 36 }: {
  name: string;
  avatarIcon: string | null;
  tone?: WhoTone;
  size?: number;
}) {
  const { c } = useTheme();
  const icon = parseAvatarIcon(avatarIcon);
  if (icon) {
    return (
      <View style={{ width: box, height: box, borderRadius: radius.pill, backgroundColor: c[tone], alignItems: "center", justifyContent: "center" }}>
        <AvatarIconMark icon={icon} color={c[`${tone}-ink`]} size={box * 0.55} />
      </View>
    );
  }
  return avatarIcon && /^https?:/.test(avatarIcon) ? (
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
        borderRadius: radius.sm,
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
