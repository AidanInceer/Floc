import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  Switch,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import { fonts, radius, size, space } from "@/lib/theme";

import { ChevronGlyph, SearchGlyph } from "./glyphs";
import { Sheet } from "./sheet";
import { useTheme } from "./theme";

type TextTone = "ink" | "ink-2" | "ink-3" | "pen" | "red" | "green" | "pastel-yellow-ink" | "pastel-blue-ink";

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
        fontFamily: bold ? fonts.sansBold : fonts.sans,
        fontSize: size.body,
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
        fontFamily: fonts.displayBold,
        fontSize: size.heading,
      }}
    >
      {children}
    </Text>
  );
}

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

export function SectionTitle({ children }: { children: ReactNode }) {
  const { c } = useTheme();
  return (
    <Text accessibilityRole="header" style={{ color: c.ink, fontFamily: fonts.sansBold, fontSize: size.body }}>
      {children}
    </Text>
  );
}

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

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const { c } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: c.sheet,
          borderColor: c.rule,
          borderWidth: StyleSheet.hairlineWidth,
          borderRadius: radius.md,
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

export function OrRule({ label }: { label: string }) {
  const { c } = useTheme();
  const line = { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: c.rule };
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
      <View style={line} />
      <Text
        style={{
          color: c["ink-3"],
          fontFamily: fonts.type,
          fontSize: size.label,
          letterSpacing: 0.6,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
      <View style={line} />
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = "primary",
  fit = "full",
  icon,
  busy,
  disabled,
}: {
  label: string;
  onPress: () => void;
  icon?: (ink: string) => ReactNode;
  variant?: "primary" | "quiet" | "danger";
  fit?: "full" | "small";
  busy?: boolean;
  disabled?: boolean;
}) {
  const { c } = useTheme();
  const ground = { primary: c.pen, quiet: c.sheet, danger: c["red-2"] }[variant];
  const ink = { primary: c.sheet, quiet: c["ink-2"], danger: c.red }[variant];
  const edge = { primary: c.pen, quiet: c["rule-2"], danger: c["red-2"] }[variant];
  const off = disabled || busy;
  const small = fit === "small";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!off, busy: !!busy }}
      onPress={onPress}
      disabled={off}
      hitSlop={small ? 4 : undefined}
      style={({ pressed }) => ({
        backgroundColor: ground,
        borderWidth: 1,
        borderColor: edge,
        borderRadius: radius.sm,
        paddingVertical: small ? space.sm : space.md,
        paddingHorizontal: small ? space.md : space.lg,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: space.sm,
        alignSelf: small ? "flex-start" : "auto",
        opacity: off ? 0.5 : pressed ? 0.85 : 1,
      })}
    >
      {busy ? <ActivityIndicator color={ink} accessible={false} /> : icon?.(ink)}
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        style={{
          color: ink,
          fontFamily: fonts.sansBold,
          fontSize: small ? size.small : size.body,
          flexShrink: 1,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Field({
  label,
  ...props
}: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: space.xs }}>
      <Label>{label}</Label>
      <TextInputBox accessibilityLabel={label} {...props} />
    </View>
  );
}

export function SearchField({
  label,
  ...props
}: TextInputProps & { label: string }) {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.sm,
        backgroundColor: c.sheet,
        borderColor: c.rule,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.sm,
        paddingHorizontal: space.md,
      }}
    >
      <SearchGlyph color={c["ink-3"]} />
      <TextInput
        accessibilityLabel={label}
        autoCorrect={false}
        autoCapitalize="words"
        placeholderTextColor={c["ink-3"]}
        {...props}
        style={{ flex: 1, paddingVertical: space.md, color: c.ink, fontFamily: fonts.sans, fontSize: size.body }}
      />
    </View>
  );
}

export function TextBox({ label, ...props }: TextInputProps & { label: string }) {
  return <TextInputBox accessibilityLabel={label} {...props} />;
}

function TextInputBox(props: TextInputProps) {
  const { c } = useTheme();
  return (
    <TextInput
      placeholderTextColor={c["ink-3"]}
      {...props}
      style={{
        backgroundColor: c.sheet,
        borderColor: c.rule,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.sm,
        padding: space.md,
        color: c.ink,
        fontFamily: fonts.sans,
        fontSize: size.body,
      }}
    />
  );
}

export function Pill({
  word,
  tone = "pastel-blue",
  sentence,
}: {
  word: string;
  tone?: "pastel-blue" | "pastel-green" | "pastel-yellow" | "pastel-red" | "neutral";
  sentence?: boolean;
}) {
  const { c } = useTheme();
  const ground = tone === "neutral" ? c.sheet : c[tone];
  const edge = tone === "neutral" ? c["rule-2"] : c[`${tone}-edge`];
  const ink = tone === "neutral" ? c["ink-2"] : c[`${tone}-ink`];
  return (
    <View
      style={{
        backgroundColor: ground,
        borderColor: edge,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.pill,
        paddingVertical: space.xs,
        paddingHorizontal: space.sm,
        alignSelf: "flex-start",
      }}
    >
      <Text
        style={{
          color: ink,
          fontFamily: fonts.type,
          fontSize: size.label,
          textTransform: sentence ? "none" : "uppercase",
          letterSpacing: sentence ? 0 : 0.6,
        }}
      >
        {word}
      </Text>
    </View>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  soft,
}: {
  options: readonly { value: T; label: string; icon?: (color: string) => ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  soft?: boolean;
}) {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: c["sheet-2"],
        borderRadius: radius.sm,
        padding: space.xs,
        gap: space.xs,
      }}
    >
      {options.map((option) => {
        const on = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(option.value)}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: space.xs,
              paddingVertical: space.sm,
              borderRadius: radius.sm,
              backgroundColor: on ? c[soft ? "pen-2" : "sheet"] : "transparent",
              borderWidth: on && !soft ? StyleSheet.hairlineWidth : 0,
              borderColor: c.rule,
            }}
          >
            {option.icon?.(on ? c.ink : c["ink-2"])}
            <Text
              style={{
                color: on ? c[soft ? "pen-deep" : "ink"] : c["ink-2"],
                fontFamily: on ? fonts.sansBold : fonts.sans,
                fontSize: size.small,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

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

export function IconButton({
  label,
  on,
  onColor = "pastel-green",
  tone = "quiet",
  disabled,
  children,
  onPress,
}: {
  label: string;
  on?: boolean;
  onColor?: "pastel-green" | "pastel-blue" | "pastel-yellow" | "pastel-red";
  tone?: "quiet" | "danger";
  disabled?: boolean;
  children: (color: string) => ReactNode;
  onPress: () => void;
}) {
  const { c } = useTheme();
  const ink = disabled
    ? c["ink-3"]
    : on
      ? c[`${onColor}-ink`]
      : tone === "danger"
        ? c.red
        : c["ink-2"];
  const ground = on && !disabled ? c[onColor] : "transparent";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!on, disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={({ pressed }) => ({
        width: 34,
        height: 34,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: radius.sm,
        backgroundColor: ground,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: on && !disabled ? c[`${onColor}-edge`] : c.rule,
        opacity: disabled ? 0.4 : pressed ? 0.6 : 1,
      })}
    >
      {children(ink)}
    </Pressable>
  );
}

export function Toggle({
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        paddingVertical: space.sm,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View style={{ flex: 1, gap: space.xs }}>
        <Body>{label}</Body>
        {hint ? <Body tone="ink-3">{hint}</Body> : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: c["sheet-3"], true: c.pen }}
        thumbColor={c.sheet}
      />
    </View>
  );
}

export function Row({ children }: { children: ReactNode }) {
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
      {children}
    </View>
  );
}

export function Dropdown<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const { c } = useTheme();
  const [open, setOpen] = useState(false);
  const chosen = options.find((option) => option.value === value);

  return (
    <View style={{ gap: space.xs }}>
      <Label>{label}</Label>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${chosen?.label ?? ""}`}
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: c.sheet,
          borderColor: c.rule,
          borderWidth: StyleSheet.hairlineWidth,
          borderRadius: radius.sm,
          padding: space.md,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Body>{chosen?.label ?? ""}</Body>
        <ChevronGlyph color={c["ink-3"]} />
      </Pressable>

      <ChoiceSheet open={open} onClose={() => setOpen(false)} options={options} value={value} onChange={onChange} />
    </View>
  );
}

export function ChoiceSheet<T extends string>({
  title,
  open,
  onClose,
  options,
  value,
  onChange,
}: {
  title?: string;
  open: boolean;
  onClose: () => void;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const { c } = useTheme();
  return (
    <Sheet open={open} onClose={onClose}>
      {title ? (
        <View style={{ paddingHorizontal: space.lg, paddingBottom: space.sm }}>
          <Heading>{title}</Heading>
        </View>
      ) : null}
      {options.map((option) => (
        <Pressable
          key={option.value}
          accessibilityRole="radio"
          accessibilityState={{ selected: option.value === value }}
          accessibilityLabel={option.label}
          onPress={() => {
            onChange(option.value);
            onClose();
          }}
          style={({ pressed }) => ({
            paddingVertical: space.md,
            paddingHorizontal: space.lg,
            backgroundColor: pressed ? c["sheet-2"] : "transparent",
          })}
        >
          <Body tone={option.value === value ? "ink" : "ink-2"}>
            {option.value === value ? `${option.label} · chosen` : option.label}
          </Body>
        </Pressable>
      ))}
    </Sheet>
  );
}
