import type { BudgetFit, LineProgress, Range } from "@floc/core/money/estimate/budget";
import { lineDetail, styleSentence } from "@floc/core/money/estimate/line-words";
import { LINE_LABELS, type EstimateLine, type SpendLine } from "@floc/core/money/estimate/lines";
import type { PlanLine } from "@floc/core/money/estimate/plan";
import type { EstimateView } from "@floc/core/money/estimate/view";
import { fitWords, progressWords, wholeMoney, wholeRange } from "@floc/core/money/estimate/words";
import type { ExpenseCategory } from "@floc/core/money/expense-category";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CategoryIcon } from "@/components/system/category-icon";
import { PenGlyph } from "@/components/system/glyphs";
import { useTheme } from "@/components/system/theme";
import { Button, Card, Pill } from "@/components/system/ui";
import { fonts, radius, size, space } from "@/lib/theme";

export type BudgetEdit = { kind: "budget" } | { kind: "line"; line: EstimateLine } | { kind: "style" } | { kind: "home" } | { kind: "nights" };

const ICON: Record<SpendLine, ExpenseCategory> = { flights: "flights", stay: "lodging", food: "food", activities: "activity", transport: "transport", other: "other" };
const FIT_TONE = { fits: "pastel-green", tight: "pastel-yellow", over: "pastel-red" } as const;

function Bar({ spent, plan, budget, thin }: { spent: number; plan: Range | null; budget?: number | null; thin?: boolean }) {
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

function Small({ tone, children }: { tone: "ink-2" | "pen"; children: React.ReactNode }) {
  const { c } = useTheme();
  return <Text style={{ color: c[tone], fontFamily: fonts.sans, fontSize: size.small }}>{children}</Text>;
}

function Detail({ text }: { text: string }) {
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

function Status({ progress, words }: { progress: LineProgress; words: string }) {
  if (progress.kind === "in-range") return <Pill sentence word={words} tone="pastel-green" />;
  if (progress.kind === "over") return <Pill sentence word={words} tone="pastel-red" />;
  return <Pill sentence word={words} tone="neutral" />;
}

function FitPill({ fit, currency }: { fit: BudgetFit; currency: EstimateView["currency"] }) {
  return <Pill sentence word={fitWords(fit, currency)} tone={FIT_TONE[fit.kind]} />;
}

function Figure({ label, value, onEdit }: { label: string; value: string; onEdit?: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable disabled={!onEdit} onPress={onEdit} accessibilityRole={onEdit ? "button" : undefined} accessibilityLabel={onEdit ? `${label} ${value}, change` : undefined} style={{ gap: 2 }}>
      <Text style={{ color: c["ink-2"], fontFamily: fonts.sans, fontSize: size.small }}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
        <Text style={{ color: c.ink, fontFamily: fonts.type, fontSize: size.body + 2, fontVariant: ["tabular-nums"] }}>{value}</Text>
        {onEdit ? <PenGlyph color={c["ink-3"]} /> : null}
      </View>
    </Pressable>
  );
}

function LineRow({ view, line, onEdit }: { view: EstimateView; line: PlanLine; onEdit: (edit: BudgetEdit) => void }) {
  const { c } = useTheme();
  const words = progressWords(line.progress, view.currency);
  const needsHome = line.line === "flights" && line.missing === "home" && !line.plan;
  return (
    <Pressable
      onPress={() => onEdit(needsHome ? { kind: "home" } : { kind: "line", line: line.line })}
      accessibilityRole="button"
      accessibilityLabel={`${LINE_LABELS[line.line]}, ${words}, change`}
      style={({ pressed }) => ({ flexDirection: "row", gap: space.md, padding: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.rule, backgroundColor: pressed ? c["sheet-2"] : "transparent" })}
    >
      <View style={{ width: 26, height: 26, borderRadius: radius.sm, backgroundColor: c["sheet-3"], alignItems: "center", justifyContent: "center" }}>
        <CategoryIcon category={ICON[line.line]} color={c["ink-2"]} size={16} />
      </View>
      <View style={{ flex: 1, gap: space.xs }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.ink, fontFamily: fonts.sans, fontSize: size.body }}>{LINE_LABELS[line.line]}</Text>
            <Detail text={lineDetail({ ...line, range: line.plan }, { style: view.style, nights: view.nights.count })} />
          </View>
          <PenGlyph color={c["ink-3"]} />
        </View>
        <Bar spent={line.spent} plan={line.plan} />
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.sm }}>
          <Text style={{ color: c.ink, fontFamily: fonts.type, fontSize: size.small, fontVariant: ["tabular-nums"] }}>
            {line.plan ? `${wholeMoney(line.spent, view.currency)} of ${wholeRange(line.plan, view.currency)}` : ""}
            {line.plan && line.own != null ? <Text style={{ color: c["ink-3"], fontFamily: fonts.sans }}> · yours</Text> : null}
          </Text>
          {needsHome ? <Small tone="pen">Add home airport</Small> : <Status progress={line.progress} words={words} />}
        </View>
      </View>
    </Pressable>
  );
}

export function BudgetView({ view, onEdit }: { view: EstimateView; onEdit: (edit: BudgetEdit) => void }) {
  const { c } = useTheme();
  const { plan, currency } = view;
  const money = (m: number) => wholeMoney(m, currency);
  const from = view.home ? `${view.home.name}${view.home.inferred ? " (from your flight files)" : ""}` : null;
  const assumed = view.nights.from === "assumed" || view.nights.from === "chosen";
  return (
    <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>
      <View style={{ padding: space.md, gap: space.md }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: space.xl, rowGap: space.sm }}>
          {plan.budget == null ? (
            <View style={{ gap: 2 }}>
              <Text style={{ color: c["ink-2"], fontFamily: fonts.sans, fontSize: size.small }}>Budget</Text>
              <Button label="Set a budget" variant="quiet" fit="small" onPress={() => onEdit({ kind: "budget" })} />
            </View>
          ) : (
            <Figure label="Budget" value={money(plan.budget)} onEdit={() => onEdit({ kind: "budget" })} />
          )}
          <Figure label="Spent" value={money(plan.spent)} />
          <Figure label="Left" value={plan.left == null ? "—" : money(plan.left)} />
          <Figure label="Estimate" value={view.places ? wholeRange(plan.total, currency) : "—"} />
        </View>
        {plan.fit ? <FitPill fit={plan.fit} currency={currency} /> : null}
        <Bar thin spent={plan.spent} plan={view.places ? plan.total : null} budget={plan.budget} />
      </View>
      {plan.lines.map((line) => <LineRow key={line.line} view={view} line={line} onEdit={onEdit} />)}
      {plan.other > 0 ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.md, padding: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.rule }}>
          <View style={{ width: 26, height: 26, borderRadius: radius.sm, backgroundColor: c["sheet-3"], alignItems: "center", justifyContent: "center" }}>
            <CategoryIcon category="other" color={c["ink-2"]} size={16} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.ink, fontFamily: fonts.sans, fontSize: size.body }}>Other</Text>
            <Text style={{ color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.small }}>Shopping, health, fees and the rest</Text>
          </View>
          <Text style={{ color: c.ink, fontFamily: fonts.type, fontSize: size.small }}>{money(plan.other)} spent</Text>
        </View>
      ) : null}
      <View style={{ padding: space.md, gap: space.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.rule }}>
        <Small tone="ink-2">{styleSentence(view.style, from)}{view.style.tripOnly ? " · this trip only" : ""}</Small>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          <Button label="Change style" variant="quiet" fit="small" onPress={() => onEdit({ kind: "style" })} />
          {assumed ? <Button label={`${view.nights.count} nights`} variant="quiet" fit="small" onPress={() => onEdit({ kind: "nights" })} /> : null}
          {view.home?.inferred ? <Button label="Confirm airport" variant="quiet" fit="small" onPress={() => onEdit({ kind: "home" })} /> : null}
        </View>
      </View>
    </Card>
  );
}
