/**
 * The house design system, drawn natively (ticket 289).
 *
 * Deliberately NOT shared with the web app's `components/ui.tsx`. The two UIs
 * are separate on purpose — a native screen should feel native — and a
 * cross-platform component library is the abstraction the plan says not to
 * build before there is evidence it helps. What IS shared is the thing that
 * actually keeps them one product: the token values, via `useTheme`.
 *
 * The rules from `docs/design/visual-language.html` hold here unchanged:
 *   - Colour comes from tokens. There is no hex literal in this file.
 *   - No emoji. Icons are line-art, drawn as strokes.
 *   - Status always carries a word, never colour alone.
 *   - If the drawing is clear, say nothing.
 */
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import { fonts, radius, size, space } from "@/lib/theme";

import { useTheme } from "./theme";

/* ------------------------------------------------------------------ text */

type TextTone = "ink" | "ink-2" | "ink-3" | "pen" | "red" | "green";

export function Body({
  children,
  tone = "ink",
  bold,
}: {
  children: ReactNode;
  tone?: TextTone;
  bold?: boolean;
}) {
  const { c } = useTheme();
  return (
    <Text
      style={{
        color: c[tone],
        fontFamily: fonts.sans,
        fontSize: size.body,
        fontWeight: bold ? "600" : "400",
      }}
    >
      {children}
    </Text>
  );
}

export function Heading({ children }: { children: ReactNode }) {
  const { c } = useTheme();
  return (
    <Text
      style={{
        color: c.ink,
        fontFamily: fonts.display,
        fontSize: size.heading,
        fontWeight: "700",
      }}
    >
      {children}
    </Text>
  );
}

/** The 11px uppercase label. `--ink-3` was darkened until it clears AA at this size (#204). */
export function Label({ children }: { children: ReactNode }) {
  const { c } = useTheme();
  return (
    <Text
      style={{
        color: c["ink-3"],
        fontFamily: fonts.type,
        fontSize: size.label,
        letterSpacing: 0.6,
        textTransform: "uppercase",
      }}
    >
      {children}
    </Text>
  );
}

/** Every figure, date, time and amount. Tabular, so columns of money line up. */
export function Figure({ children, tone = "ink" }: { children: ReactNode; tone?: TextTone }) {
  const { c } = useTheme();
  return (
    <Text
      style={{
        color: c[tone],
        fontFamily: fonts.type,
        fontSize: size.body,
        fontVariant: ["tabular-nums"],
      }}
    >
      {children}
    </Text>
  );
}

/* --------------------------------------------------------------- surfaces */

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const { c } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: c.sheet,
          borderColor: c.rule,
          borderWidth: StyleSheet.hairlineWidth,
          borderRadius: radius.lg,
          padding: space.lg,
          gap: space.sm,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Divider() {
  const { c } = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.rule }} />;
}

/* --------------------------------------------------------------- controls */

export function Button({
  label,
  onPress,
  variant = "primary",
  busy,
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "quiet" | "danger";
  busy?: boolean;
  disabled?: boolean;
}) {
  const { c } = useTheme();
  const ground = { primary: c.pen, quiet: c["sheet-2"], danger: c["red-2"] }[variant];
  const ink = { primary: c.sheet, quiet: c.ink, danger: c.red }[variant];
  const off = disabled || busy;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!busy }}
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => ({
        backgroundColor: ground,
        borderRadius: radius.md,
        paddingVertical: space.md,
        paddingHorizontal: space.lg,
        alignItems: "center",
        opacity: off ? 0.5 : pressed ? 0.85 : 1,
      })}
    >
      {busy ? (
        <ActivityIndicator color={ink} />
      ) : (
        <Text style={{ color: ink, fontFamily: fonts.sans, fontSize: size.body, fontWeight: "600" }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  ...props
}: TextInputProps & { label: string }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: space.xs }}>
      <Label>{label}</Label>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={c["ink-3"]}
        {...props}
        style={{
          backgroundColor: c.sheet,
          borderColor: c.rule,
          borderWidth: StyleSheet.hairlineWidth,
          borderRadius: radius.md,
          padding: space.md,
          color: c.ink,
          fontFamily: fonts.sans,
          fontSize: size.body,
        }}
      />
    </View>
  );
}

/**
 * A status pill. `word` is not optional and never will be: colour alone tells
 * nobody anything who cannot see it (#204).
 */
export function Pill({
  word,
  tone = "peri",
}: {
  word: string;
  tone?: "peri" | "mint" | "butter" | "blush";
}) {
  const { c } = useTheme();
  return (
    <View
      style={{
        backgroundColor: c[tone],
        borderColor: c[`${tone}-edge`],
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.pill,
        paddingVertical: space.xs,
        paddingHorizontal: space.sm,
        alignSelf: "flex-start",
      }}
    >
      <Text
        style={{
          color: c[`${tone}-ink`],
          fontFamily: fonts.type,
          fontSize: size.label,
          textTransform: "uppercase",
          letterSpacing: 0.6,
        }}
      >
        {word}
      </Text>
    </View>
  );
}

/**
 * What is missing, said plainly. One of the two things text is still for when
 * the drawing is clear — the other being status.
 */
export function Empty({ children }: { children: ReactNode }) {
  return (
    <View style={{ paddingVertical: space.xxl, alignItems: "center", gap: space.sm }}>
      <Body tone="ink-2">{children}</Body>
    </View>
  );
}

export function Loading() {
  const { c } = useTheme();
  return (
    <View style={{ paddingVertical: space.xxl, alignItems: "center" }}>
      <ActivityIndicator color={c.pen} />
    </View>
  );
}

/** A failed read says what failed and offers the retry — never a bare spinner that never ends. */
export function Failed({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={{ paddingVertical: space.xxl, alignItems: "center", gap: space.md }}>
      <Body tone="ink-2">That didn&apos;t load.</Body>
      <Button label="Try again" onPress={onRetry} variant="quiet" />
    </View>
  );
}

export function Screen({ children }: { children: ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: c.paper, padding: space.lg, gap: space.lg }}>
      {children}
    </View>
  );
}
