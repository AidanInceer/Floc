/** Text and buttons on the Pro ground, where the house ones would read as blue. */
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { useTheme } from "../system/theme";
import { fonts, radius, size, space } from "@/lib/theme";

export function ProText({ children, quiet }: { children: ReactNode; quiet?: boolean }) {
  const { c } = useTheme();
  return (
    <Text
      style={{
        color: quiet ? c["pro-ink-2"] : c["pro-ink"],
        fontFamily: fonts.sans,
        fontSize: quiet ? size.small : size.body,
      }}
    >
      {children}
    </Text>
  );
}

export function ProButton({
  label,
  lead,
  disabled,
  onPress,
}: {
  label: string;
  lead?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: "center",
        paddingVertical: space.md,
        paddingHorizontal: space.sm,
        borderRadius: radius.sm,
        backgroundColor: lead ? c["pro-ink"] : c["pro-2"],
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: lead ? c["pro-ink"] : c["pro-edge"],
        opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
      })}
    >
      <Text style={{ color: lead ? c["pro-2"] : c["pro-ink"], fontFamily: fonts.sansBold, fontSize: size.small }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** One Pro plan (#523): the store's charge and its period, with the per-month figure and saving on a small line under it. All plans wear one skin — none is pre-selected. */
export function PlanButton({
  offer,
  disabled,
  onPress,
}: {
  offer: { label: string; charge: string; per: string; perMonth: string | null; saving: string | null };
  disabled?: boolean;
  onPress: () => void;
}) {
  const { c } = useTheme();
  const extra = [offer.perMonth, offer.saving].filter(Boolean).join(" · ");
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${offer.label}, ${offer.charge} ${offer.per}${extra ? `, ${extra}` : ""}`}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        gap: space.xs,
        paddingVertical: space.md,
        paddingHorizontal: space.md,
        borderRadius: radius.sm,
        backgroundColor: c["pro-2"],
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: c["pro-edge"],
        opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
      })}
    >
      <Text style={{ color: c["pro-ink"], fontSize: size.small }}>
        <Text style={{ fontFamily: fonts.typeBold }}>{offer.charge}</Text>
        <Text style={{ fontFamily: fonts.sans }}>{` ${offer.per}`}</Text>
      </Text>
      {extra ? (
        <Text style={{ color: c["pro-ink-2"], fontFamily: fonts.type, fontSize: size.label }}>{extra}</Text>
      ) : null}
    </Pressable>
  );
}