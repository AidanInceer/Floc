import type { BudgetFit } from "@floc/core/money/estimate/budget";
import { styleSentence } from "@floc/core/money/estimate/line-words";
import { isFlying, type PlanLine } from "@floc/core/money/estimate/plan";
import { awaitingWords, removedLabel } from "@floc/core/money/estimate/travel";
import type { EstimateView } from "@floc/core/money/estimate/view";
import { fitWords, WAITING_LINES_TITLE, wholeMoney, wholeRange } from "@floc/core/money/estimate/words";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { PenGlyph } from "@/components/system/glyphs";
import { useTheme } from "@/components/system/theme";
import { Button, Card, Pill } from "@/components/system/ui";
import { fonts, size, space } from "@/lib/theme";

import { AddBack, BudgetLine, RemovedLine, type LineActions } from "./budget-line";
import { Bar, LineGlyph, LineIcon, Small } from "./budget-marks";

export type BudgetEdit = { kind: "budget" } | { kind: "style" } | { kind: "home" } | { kind: "nights" };

const FIT_TONE = { fits: "pastel-green", tight: "pastel-yellow", over: "pastel-red" } as const;

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

function Summary({ view, onEdit }: { view: EstimateView; onEdit: (edit: BudgetEdit) => void }) {
  const { c } = useTheme();
  const { plan, currency } = view;
  const money = (m: number) => wholeMoney(m, currency);
  return (
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
      {plan.awaiting ? <Pill sentence word={awaitingWords(plan.awaiting)} tone="neutral" /> : plan.fit ? <FitPill fit={plan.fit} currency={currency} /> : null}
      <Bar thin spent={plan.spent} plan={view.places ? plan.total : null} budget={plan.budget} />
    </View>
  );
}

function LineRow({ view, line, act, onEdit }: { view: EstimateView; line: PlanLine; act: LineActions; onEdit: (edit: BudgetEdit) => void }) {
  if (line.needed) return <BudgetLine view={view} line={line} act={act} onHome={() => onEdit({ kind: "home" })} />;
  return line.spent > 0 ? <RemovedLine view={view} line={line} act={act} /> : null;
}

function OtherRow({ amount, currency }: { amount: number; currency: EstimateView["currency"] }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.md, padding: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.rule }}>
      <LineIcon line="other" />
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.ink, fontFamily: fonts.sans, fontSize: size.body }}>Other</Text>
        <Text style={{ color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.small }}>Shopping, health, fees and the rest</Text>
      </View>
      <Text style={{ color: c.ink, fontFamily: fonts.type, fontSize: size.small }}>{wholeMoney(amount, currency)} spent</Text>
    </View>
  );
}

function WaitingLines({ view, act }: { view: EstimateView; act: LineActions }) {
  const { c } = useTheme();
  const waiting = view.plan.lines.filter((l) => !l.needed && l.spent === 0);
  if (waiting.length === 0) return null;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: space.md, rowGap: space.sm }}>
      <Small tone="ink-2">{WAITING_LINES_TITLE}</Small>
      {waiting.map((line) => (
        <View key={line.line} style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
          <LineGlyph line={line.line} travel={view.plan.travel} color={c["ink-2"]} />
          <Small tone="ink-2">{removedLabel(line.line)}</Small>
          <AddBack label={removedLabel(line.line)} onAdd={(report) => act.needed(line.line, true, report)} />
        </View>
      ))}
    </View>
  );
}

function FootLink({ words, onPress }: { words: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={14} accessibilityRole="button" accessibilityLabel={words}>
      <Small tone="pen">{words}</Small>
    </Pressable>
  );
}

function Foot({ view, act, onEdit }: { view: EstimateView; act: LineActions; onEdit: (edit: BudgetEdit) => void }) {
  const { c } = useTheme();
  const flying = isFlying(view.plan);
  const from = view.home ? `${view.home.name}${view.home.inferred ? " (from your flight files)" : ""}` : null;
  const assumed = view.nights.from === "assumed" || view.nights.from === "chosen";
  return (
    <View style={{ padding: space.md, gap: space.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.rule }}>
      <Small tone="ink-2">{styleSentence(view.style, from, flying)}{view.style.tripOnly ? " · this trip only" : ""}</Small>
      <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: space.lg, rowGap: space.sm }}>
        <FootLink words="Change" onPress={() => onEdit({ kind: "style" })} />
        {assumed ? <FootLink words={`${view.nights.count} nights`} onPress={() => onEdit({ kind: "nights" })} /> : null}
        {flying && view.home?.inferred ? <FootLink words="Confirm airport" onPress={() => onEdit({ kind: "home" })} /> : null}
      </View>
      <WaitingLines view={view} act={act} />
    </View>
  );
}

export function BudgetView({ view, act, onEdit }: { view: EstimateView; act: LineActions; onEdit: (edit: BudgetEdit) => void }) {
  const { plan, currency } = view;
  return (
    <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>
      <Summary view={view} onEdit={onEdit} />
      {plan.lines.map((line) => <LineRow key={line.line} view={view} line={line} act={act} onEdit={onEdit} />)}
      {plan.other > 0 ? <OtherRow amount={plan.other} currency={currency} /> : null}
      <Foot view={view} act={act} onEdit={onEdit} />
    </Card>
  );
}
