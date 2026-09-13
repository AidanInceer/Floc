// Why: the closed drawer shows its answer, so most visits open nothing.
import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FlockChevronGlyph } from "./glyphs";
import { useTheme } from "./theme";
import { Label } from "./ui";
import { fonts, radius, size, space } from "@/lib/theme";

const TURN = { down: "0deg", up: "180deg" } as const;

// Why: the glyph is wider than tall, so a turned one shifts unless every row gives it the same square.
export function DrawerChevron({ color, point }: { color: string; point: keyof typeof TURN }) {
  return (
    <View style={{ width: 20, height: 20, alignItems: "center", justifyContent: "center" }}>
      <View style={{ transform: [{ rotate: TURN[point] }] }}>
        <FlockChevronGlyph color={color} />
      </View>
    </View>
  );
}

export function DrawerGroup({
  label,
  danger,
  children,
}: {
  label?: string;
  danger?: boolean;
  children: ReactNode;
}) {
  const { c } = useTheme();
  return (
    <View style={{ gap: space.sm }}>
      {label ? (
        <View style={{ paddingHorizontal: space.xs }}>
          <Label>{label}</Label>
        </View>
      ) : null}
      <View
        style={{
          backgroundColor: c.sheet,
          borderColor: danger ? c["red-edge"] : c.rule,
          borderWidth: StyleSheet.hairlineWidth,
          borderRadius: radius.lg,
          overflow: "hidden",
        }}
      >
        {children}
      </View>
    </View>
  );
}

function Header({
  title,
  summary,
  danger,
  tint,
  trailing,
}: {
  title: string;
  summary?: string;
  danger?: boolean;
  tint?: boolean;
  trailing: ReactNode;
}) {
  const { c } = useTheme();
  return (
    <>
      <Text
        style={{
          flex: 1,
          color: danger ? c.red : tint ? c["ink-2"] : c.ink,
          fontFamily: tint ? fonts.sans : fonts.sansBold,
          fontSize: size.body,
          textAlign: tint ? "center" : "left",
        }}
      >
        {title}
      </Text>
      {summary ? (
        <Text
          numberOfLines={1}
          style={{ flexShrink: 1, color: c["ink-3"], fontFamily: fonts.type, fontSize: size.small }}
        >
          {summary}
        </Text>
      ) : null}
      {trailing}
    </>
  );
}

const rowStyle = { flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: space.md, paddingHorizontal: space.lg } as const;

export function Drawer({
  title,
  summary,
  danger,
  first,
  defaultOpen = false,
  children,
}: {
  title: string;
  summary?: string;
  danger?: boolean;
  /** The top row in a group draws no rule above itself. */
  first?: boolean;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const { c } = useTheme();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View style={{ borderTopColor: c.rule, borderTopWidth: first ? 0 : StyleSheet.hairlineWidth }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={summary ? `${title}, ${summary}` : title}
        onPress={() => setOpen(!open)}
        style={({ pressed }) => ({ ...rowStyle, backgroundColor: open || pressed ? c["sheet-2"] : c.sheet })}
      >
        <Header
          title={title}
          summary={summary}
          danger={danger}
          trailing={<DrawerChevron color={danger ? c.red : c["ink-3"]} point={open ? "up" : "down"} />}
        />
      </Pressable>
      {open ? <View style={{ padding: space.lg, gap: space.md }}>{children}</View> : null}
    </View>
  );
}

export function DrawerLink({
  title,
  summary,
  first,
  quiet,
  onPress,
}: {
  title: string;
  summary?: string;
  first?: boolean;
  /** Ends something rather than opening it, so it draws no chevron. */
  quiet?: boolean;
  onPress: () => void;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={summary ? `${title}, ${summary}` : title}
      onPress={onPress}
      style={({ pressed }) => ({
        ...rowStyle,
        borderTopColor: c.rule,
        borderTopWidth: first ? 0 : StyleSheet.hairlineWidth,
        backgroundColor: pressed ? c["sheet-2"] : c.sheet,
      })}
    >
      <Header
        title={title}
        summary={summary}
        tint={quiet}
        trailing={
          quiet ? null : <DrawerChevron color={c["ink-3"]} point="down" />
        }
      />
    </Pressable>
  );
}
