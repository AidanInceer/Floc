import type { LineProgress, Range } from "@floc/core/money/estimate/budget";
import type { SpendLine } from "@floc/core/money/estimate/lines";
import { TRAVEL_GLYPHS, type TravelMode } from "@floc/core/money/estimate/travel";
import type { ExpenseCategory } from "@floc/core/money/expense-category";
import { StyleSheet, Text, View } from "react-native";

import { CategoryIcon } from "@/components/system/category-icon";
import { useTheme } from "@/components/system/theme";
import { TravelModeGlyph } from "@/components/system/travel-mode-glyph";
import { Pill } from "@/components/system/ui";
import { fonts, radius, size } from "@/lib/theme";

const ICON: Record<SpendLine, ExpenseCategory> = { flights: "flights", stay: "lodging", food: "food", activities: "activity", transport: "transport", other: "other" };

export function Bar({ spent, plan, budget, thin }: { spent: number; plan: Range | null; budget?: number | null; thin?: boolean }) {
  const { c } = useTheme();
  const max = Math.max(plan?.[1] ?? 0, spent, budget ?? 0) * 1.1 || 1;
  const pct = (v: number) => `${Math.max(0, Math.min(100, (v / max) * 100))}%` as const;
  return (
    <View accessible={false} style={{ height: thin ? 6 : 8, borderRadius: radius.pill, backgroundColor: c["sheet-3"] }}>
      {plan ? (
        <View style={{ position: "absolute", top: 0, bottom: 0, left: pct(plan[0]), width: pct(plan[1] - plan[0]), minWidth: 4, borderRadius: radius.pill, backgroundColor: c["pastel-red-edge"], borderWidth: StyleSheet.hairlineWidth, borderColor: c["pastel-red-ink"] }} />
      ) : null}
      <View style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: pct(spent), borderRadius: radius.pill, backgroundColor: c.ink }} />
      {budget != null ? <View style={{ position: "absolute", top: -4, bottom: -4, left: pct(budget), width: 2, marginLeft: -1, backgroundColor: c.ink }} /> : null}
    </View>
  );
}

export function Small({ tone, children }: { tone: "ink-2" | "pen"; children: React.ReactNode }) {
  const { c } = useTheme();
  return <Text style={{ color: c[tone], fontFamily: fonts.sans, fontSize: size.small }}>{children}</Text>;
}

export function Detail({ text }: { text: string }) {
  const { c } = useTheme();
  const parts = text.split(" · ");
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: 4 }}>
      {parts.map((part, i) => (
        <Text key={i} style={{ color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.small }}>{i < parts.length - 1 ? `${part} ·` : part}</Text>
      ))}
    </View>
  );
}

export function Status({ progress, words }: { progress: LineProgress; words: string }) {
  if (progress.kind === "in-range") return <Pill sentence word={words} tone="pastel-green" />;
  if (progress.kind === "over") return <Pill sentence word={words} tone="pastel-red" />;
  return <Pill sentence word={words} tone="neutral" />;
}

export function LineGlyph({ line, travel = "flights", color }: { line: SpendLine; travel?: TravelMode; color: string }) {
  return line === "flights" && travel !== "flights"
    ? <TravelModeGlyph mode={TRAVEL_GLYPHS[travel]} color={color} size={16} />
    : <CategoryIcon category={ICON[line]} color={color} size={16} />;
}

export function LineIcon({ line, travel, muted }: { line: SpendLine; travel?: TravelMode; muted?: boolean }) {
  const { c } = useTheme();
  return (
    <View style={{ width: 26, height: 26, borderRadius: radius.sm, backgroundColor: muted ? c["sheet-3"] : c["pastel-red"], alignItems: "center", justifyContent: "center" }}>
      <LineGlyph line={line} travel={travel} color={muted ? c["ink-2"] : c["pastel-red-ink"]} />
    </View>
  );
}
