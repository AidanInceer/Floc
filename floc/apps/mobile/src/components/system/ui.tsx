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
 *
 * Its twin is `floc/apps/web/src/components/ui.tsx`. Separate files, one
 * product: a control added or restyled there needs the same move here, or a
 * reason it does not apply on a phone.
 */
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

import { ChevronGlyph } from "./glyphs";
import { Sheet } from "./sheet";
import { useTheme } from "./theme";

/* ------------------------------------------------------------------ text */

/** Every tone is a token name. `butter-ink` is here so text on a butter ground keeps its contrast (#204). */
type TextTone = "ink" | "ink-2" | "ink-3" | "pen" | "red" | "green" | "butter-ink" | "peri-ink";

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

/**
 * A rule with a word sitting in it — "or" between two ways of doing the same
 * thing (#no-ticket). A plain gap between the password button and the provider
 * button reads as two unrelated stacks; the rule says they are alternatives.
 */
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

/* --------------------------------------------------------------- controls */

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
  /** Drawn before the label, in the label's own colour. Line-art only, no emoji. */
  icon?: (ink: string) => ReactNode;
  variant?: "primary" | "quiet" | "danger";
  /**
   * `full` fills its parent, which is what a phone wants for the one thing you
   * came to do. `small` shrinks to its words, for the two or three controls
   * that share a line — a rare job at full width is the loudest thing on the
   * card, which is how the group panel ended up shouting "Share trip".
   */
  fit?: "full" | "small";
  busy?: boolean;
  disabled?: boolean;
}) {
  const { c } = useTheme();
  const ground = { primary: c.pen, quiet: c.sheet, danger: c["red-2"] }[variant];
  const ink = { primary: c.sheet, quiet: c["ink-2"], danger: c.red }[variant];
  // The web's secondary button is an outline on the sheet, not a grey slab
  // (`ui.tsx`, `variants.secondary`). A filled quiet button carried the same
  // weight as the primary next to it, so the pair read as two primaries.
  const edge = { primary: c.pen, quiet: c["rule-2"], danger: c["red-2"] }[variant];
  const off = disabled || busy;
  const small = fit === "small";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!busy }}
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => ({
        backgroundColor: ground,
        borderWidth: 1,
        borderColor: edge,
        borderRadius: radius.md,
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
      {busy ? (
        <ActivityIndicator color={ink} />
      ) : (
        <>
          {icon ? icon(ink) : null}
          <Text
          numberOfLines={1}
          style={{
            color: ink,
            fontFamily: fonts.sansBold,
            fontSize: small ? size.small : size.body,
          }}
        >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

/**
 * A press that is a sentence, not a control (#no-ticket).
 *
 * WHY IT IS NOT A BUTTON. "Forgotten your password?" drawn as a bordered box
 * carries the same weight as "Sign in" — five boxes down a screen and nothing
 * says which one you came for. A rare afterthought is a line of text you can
 * tap, centred under the thing it follows.
 */
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

/**
 * A search box. No label above it: the placeholder is the whole question, and
 * a labelled row for it would spend a line saying twice what one line says.
 * `placeholder` is required because it doubles as the accessible name.
 */
export function SearchField({
  placeholder,
  ...props
}: TextInputProps & { placeholder: string }) {
  return (
    <TextInputBox
      accessibilityLabel={placeholder}
      placeholder={placeholder}
      autoCorrect={false}
      autoCapitalize="words"
      {...props}
    />
  );
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
        borderRadius: radius.md,
        padding: space.md,
        color: c.ink,
        fontFamily: fonts.sans,
        fontSize: size.body,
      }}
    />
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
 * One row of choices, one of them on (ticket 297).
 *
 * A view switch, not a filter and not a setting — which is why the chosen one
 * is filled rather than ticked, and why there is no "all". Each option is its
 * own word: the fill is a second signal, never the only one (#204).
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string; icon?: (color: string) => ReactNode }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: c["sheet-2"],
        borderRadius: radius.pill,
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
              borderRadius: radius.pill,
              backgroundColor: on ? c.sheet : "transparent",
              borderWidth: on ? StyleSheet.hairlineWidth : 0,
              borderColor: c.rule,
            }}
          >
            {option.icon?.(on ? c.ink : c["ink-2"])}
            <Text
              style={{
                color: on ? c.ink : c["ink-2"],
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

/**
 * A square tap target holding one glyph (#302 follow-up).
 *
 * WHY THIS EXISTS. Packing drew a stack of full-width `Button`s per line —
 * three bars of the same weight as "Save", for actions that are neither
 * primary nor rare. That is a web page's row of buttons dropped onto a phone:
 * it makes a five-item list four screens long and gives "Remove" the same
 * shout as "I've packed it".
 *
 * A glyph alone is allowed here and only here: the row's *status* is still a
 * word beside it (#204), and every one of these carries `accessibilityLabel`,
 * so nothing is said by drawing alone.
 */
export function IconButton({
  label,
  on,
  onColor = "mint",
  tone = "quiet",
  disabled,
  children,
  onPress,
}: {
  /** Said aloud, and the only place the action is named. Never optional. */
  label: string;
  /** Filled rather than outlined — the state is on. */
  on?: boolean;
  /** The pastel an "on" button wears. */
  onColor?: "mint" | "peri" | "butter" | "blush";
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
        borderRadius: radius.md,
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

/**
 * A setting that is on or off, saved the moment it moves.
 *
 * NO SAVE BUTTON. The web draws these in a form with one Save at the foot,
 * because a browser form is how a page posts. A phone has no such excuse: the
 * switch is the answer, so the switch is the write. That removes eight
 * buttons from the settings screen and the question of what is unsaved.
 *
 * THE HINT IS ONLY EVER WHAT THE DRAWING CANNOT SAY — a consequence, not a
 * restatement of the label. Most rows have none.
 */
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

/** A list line: what it is on the left, what you can do to it on the right. */
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
        borderRadius: radius.md,
        paddingVertical: space.sm,
        paddingHorizontal: space.md,
      }}
    >
      {children}
    </View>
  );
}

/**
 * Pick one of a list, from a sheet.
 *
 * A phone has no `<select>`, and the two obvious substitutes both failed here:
 * a `Segmented` lays eight equal cells across the width and breaks a word
 * across two lines, and a scrolling pill strip drawn directly above the
 * packing filter made two different questions look like one control (#302).
 * A closed line showing the answer is neither.
 */
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
          borderRadius: radius.md,
          padding: space.md,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Body>{chosen?.label ?? ""}</Body>
        <ChevronGlyph color={c["ink-3"]} />
      </Pressable>

      <Sheet open={open} onClose={() => setOpen(false)}>
        {options.map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: option.value === value }}
            accessibilityLabel={option.label}
            onPress={() => {
              onChange(option.value);
              setOpen(false);
            }}
            style={({ pressed }) => ({
              paddingVertical: space.md,
              paddingHorizontal: space.lg,
              backgroundColor: pressed ? c["sheet-2"] : "transparent",
            })}
          >
            {/* The chosen one says so in words — a tint alone is not a state (#204). */}
            <Body tone={option.value === value ? "ink" : "ink-2"}>
              {option.value === value ? `${option.label} · chosen` : option.label}
            </Body>
          </Pressable>
        ))}
      </Sheet>
    </View>
  );
}
