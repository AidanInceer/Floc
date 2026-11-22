import { currencySymbol, type Currency } from "@floc/core/money/currency";
import { lineDetail, withLineBudget } from "@floc/core/money/estimate/line-words";
import type { EstimateLine } from "@floc/core/money/estimate/lines";
import type { PlanLine } from "@floc/core/money/estimate/plan";
import { lineLabel, NOT_IN_BUDGET, removedLabel, TRAVEL_LABELS, TRAVEL_MODES, type TravelMode } from "@floc/core/money/estimate/travel";
import type { EstimateView } from "@floc/core/money/estimate/view";
import { progressWords, wholeMoney, wholeRange } from "@floc/core/money/estimate/words";
import { toMajorInput } from "@floc/core/money/money";
import { useEffect, useRef, useState } from "react";
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { ChevronGlyph, MoreGlyph, TickGlyph } from "@/components/system/glyphs";
import { Sheet } from "@/components/system/sheet";
import { useTheme } from "@/components/system/theme";
import { Body, Label } from "@/components/system/ui";
import { fonts, radius, size, space } from "@/lib/theme";

import { Bar, Detail, LineGlyph, LineIcon, Small, Status } from "./budget-marks";
import { useReveal } from "./budget-scroll";

export type AmountField = "figure" | "budget";
export type Report = (problem: string | null) => void;
export type LineActions = {
  amount: (line: EstimateLine, field: AmountField, raw: string, report: Report) => void;
  needed: (line: EstimateLine, needed: boolean, report: Report) => void;
  travel: (mode: TravelMode, report: Report) => void;
};

const FIELD_WORDS: Record<AmountField, string> = { figure: "Your figure", budget: "Line budget" };
const MENU_ROW = { minHeight: 48, flexDirection: "row", alignItems: "center", gap: space.sm, paddingHorizontal: space.lg } as const;

function useSaving() {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const run = (go: (report: Report) => void, onDone?: () => void) => {
    setBusy(true);
    go((error) => {
      setBusy(false);
      setProblem(error);
      if (!error) onDone?.();
    });
  };
  return { busy, problem, run, clear: () => setProblem(null) };
}

function TravelPicker({ travel, busy, onPick }: { travel: TravelMode; busy: boolean; onPick: (mode: TravelMode) => void }) {
  const { c } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        disabled={busy}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityState={{ busy }}
        accessibilityLabel={`How you get there: ${TRAVEL_LABELS[travel]}`}
        style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 2, height: 26, paddingLeft: space.sm, paddingRight: space.xs, borderRadius: radius.sm, borderWidth: 1, borderColor: pressed ? c.pen : c["rule-2"], backgroundColor: pressed ? c["pen-2"] : c.sheet })}
      >
        <Text style={{ color: c.ink, fontFamily: fonts.sans, fontSize: size.body }}>{TRAVEL_LABELS[travel]}{busy ? "…" : ""}</Text>
        <ChevronGlyph color={c["ink-2"]} />
      </Pressable>
      <Sheet open={open} onClose={() => setOpen(false)}>
        <View style={{ paddingHorizontal: space.lg, paddingBottom: space.sm }}><Body bold>Getting there</Body></View>
        {TRAVEL_MODES.map((mode) => (
          <Pressable
            key={mode}
            accessibilityRole="radio"
            accessibilityState={{ selected: mode === travel }}
            accessibilityLabel={TRAVEL_LABELS[mode]}
            onPress={() => { setOpen(false); onPick(mode); }}
            style={({ pressed }) => ({ ...MENU_ROW, backgroundColor: mode === travel || pressed ? c["pen-2"] : "transparent" })}
          >
            <LineGlyph line="flights" travel={mode} color={mode === travel ? c["pen-deep"] : c["ink-2"]} />
            <Text style={{ flex: 1, color: mode === travel ? c["pen-deep"] : c["ink-2"], fontFamily: fonts.sans, fontSize: size.body }}>{TRAVEL_LABELS[mode]}</Text>
            {mode === travel ? <TickGlyph color={c["pen-deep"]} /> : null}
          </Pressable>
        ))}
      </Sheet>
    </>
  );
}

function LineMenu({ label, open, onClose, onPick }: { label: string; open: boolean; onClose: () => void; onPick: (choice: AmountField | "remove") => void }) {
  const { c } = useTheme();
  const items: [AmountField | "remove", string][] = [["figure", "Change figure"], ["budget", "Budget for this line"], ["remove", "Not needed on this trip"]];
  return (
    <Sheet open={open} onClose={onClose}>
      <View style={{ paddingHorizontal: space.lg, paddingBottom: space.sm }}><Body bold>{label}</Body></View>
      {items.map(([choice, words]) => (
        <Pressable
          key={choice}
          accessibilityRole="button"
          accessibilityLabel={words}
          onPress={() => { onClose(); onPick(choice); }}
          style={({ pressed }) => ({ ...MENU_ROW, backgroundColor: pressed ? c["sheet-2"] : "transparent" })}
        >
          <Body>{words}</Body>
        </Pressable>
      ))}
    </Sheet>
  );
}

function AmountInput({ field, currency, initial, state, onSave, onCancel }: {
  field: AmountField;
  currency: Currency;
  initial: string;
  state: { focus: boolean; busy: boolean };
  onSave: (raw: string) => void;
  onCancel: () => void;
}) {
  const { c } = useTheme();
  const input = useRef<TextInput>(null);
  const reveal = useReveal();
  const [raw, setRaw] = useState(initial);
  const symbol = currencySymbol(currency);
  const words = symbol ? FIELD_WORDS[field] : `${FIELD_WORDS[field]}, ${currency}`;

  useEffect(() => {
    if (!state.focus) return;
    const later = setTimeout(() => input.current?.focus(), 250);
    return () => clearTimeout(later);
  }, [state.focus]);

  useEffect(() => {
    const hidden = Keyboard.addListener("keyboardDidHide", () => input.current?.blur());
    return () => hidden.remove();
  }, []);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: space.sm }}>
      <Label>{state.busy ? `${words}…` : words}</Label>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs, width: 120, height: 36, paddingHorizontal: space.sm, borderWidth: 1, borderColor: c["rule-2"], borderRadius: radius.sm, backgroundColor: c.sheet }}>
        {symbol ? <Text style={{ color: c["ink-2"], fontFamily: fonts.type, fontSize: size.small }}>{symbol}</Text> : null}
        <TextInput
          ref={input}
          accessibilityLabel={FIELD_WORDS[field]}
          value={raw}
          onChangeText={setRaw}
          onFocus={() => reveal(input.current)}
          editable={!state.busy}
          keyboardType="decimal-pad"
          returnKeyType="done"
          autoCorrect={false}
          onEndEditing={(event) => {
            const text = event.nativeEvent.text;
            if (text.trim() === initial) onCancel();
            else onSave(text);
          }}
          style={{ flex: 1, padding: 0, color: c.ink, fontFamily: fonts.type, fontSize: size.small }}
        />
      </View>
    </View>
  );
}

function LineFigures({ view, line, busy, onHome }: { view: EstimateView; line: PlanLine; busy: boolean; onHome: () => void }) {
  const { c } = useTheme();
  const needsHome = line.line === "flights" && line.missing === "home" && !line.plan;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.sm }}>
      <Text style={{ color: c.ink, fontFamily: fonts.type, fontSize: size.small, fontVariant: ["tabular-nums"] }}>
        {line.plan ? `${wholeMoney(line.spent, view.currency)} of ${wholeRange(line.plan, view.currency)}${busy ? "…" : ""}` : ""}
      </Text>
      {needsHome ? <Pressable onPress={onHome} hitSlop={14} accessibilityRole="button"><Small tone="pen">Add home airport</Small></Pressable> : <Status progress={line.progress} words={progressWords(line.progress, view.currency)} />}
    </View>
  );
}

function rowDetail(view: EstimateView, line: PlanLine, editing: AmountField | null): string {
  if (editing && line.guide) return `Floc’s guide: ${wholeRange(line.guide, view.currency)}`;
  const words = lineDetail({ ...line, range: line.plan }, { style: view.style, nights: view.nights.count, travel: view.plan.travel });
  return withLineBudget(words, line.budget, view.currency);
}

export function BudgetLine({ view, line, act, onHome }: { view: EstimateView; line: PlanLine; act: LineActions; onHome: () => void }) {
  const { c } = useTheme();
  const [menu, setMenu] = useState(false);
  const [editing, setEditing] = useState<AmountField | null>(null);
  const { busy, problem, run, clear } = useSaving();
  const { travel } = view.plan;
  const label = lineLabel(line.line, travel);
  const field = editing ?? (line.missing === "travel" && !line.plan ? "figure" : null);
  const held = field === "budget" ? line.budget : line.own;
  const pick = (choice: AmountField | "remove") => {
    if (choice === "remove") run((report) => act.needed(line.line, false, report));
    else setEditing(choice);
  };
  return (
    <View style={{ flexDirection: "row", gap: space.md, padding: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.rule }}>
      <LineIcon line={line.line} travel={travel} />
      <View style={{ flex: 1, gap: space.xs }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
          <View style={{ flex: 1, gap: 2 }}>
            {line.line === "flights"
              ? <TravelPicker travel={travel} busy={busy} onPick={(mode) => run((report) => act.travel(mode, report))} />
              : <Text style={{ color: c.ink, fontFamily: fonts.sans, fontSize: size.body }}>{label}</Text>}
            <Detail text={rowDetail(view, line, editing)} />
          </View>
          <Pressable onPress={() => setMenu(true)} disabled={busy} hitSlop={10} accessibilityRole="button" accessibilityLabel={`More for ${label}`} style={{ width: 26, height: 26, alignItems: "center", justifyContent: "center" }}>
            <MoreGlyph color={c["ink-3"]} />
          </Pressable>
        </View>
        <Bar spent={line.spent} plan={line.plan} budget={line.budget} />
        {field && line.spent > 0 ? <Text style={{ color: c.ink, fontFamily: fonts.type, fontSize: size.small, fontVariant: ["tabular-nums"] }}>{wholeMoney(line.spent, view.currency)} spent</Text> : null}
        {field ? (
          <AmountInput
            key={field}
            field={field}
            currency={view.currency}
            initial={held == null ? "" : toMajorInput(held, view.currency)}
            state={{ focus: editing !== null, busy }}
            onSave={(raw) => run((report) => act.amount(line.line, field, raw, report), () => setEditing(null))}
            onCancel={() => { clear(); setEditing(null); }}
          />
        ) : <LineFigures view={view} line={line} busy={busy} onHome={onHome} />}
        {problem ? <Body tone="red">{problem}</Body> : null}
      </View>
      <LineMenu label={label} open={menu} onClose={() => setMenu(false)} onPick={pick} />
    </View>
  );
}

export function RemovedLine({ view, line, act }: { view: EstimateView; line: PlanLine; act: LineActions }) {
  const { c } = useTheme();
  const label = removedLabel(line.line);
  return (
    <View style={{ flexDirection: "row", gap: space.md, padding: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.rule }}>
      <LineIcon muted line={line.line} travel={view.plan.travel} />
      <View style={{ flex: 1, gap: space.xs }}>
        <View style={{ gap: 2 }}>
          <Text style={{ color: c["ink-2"], fontFamily: fonts.sans, fontSize: size.body }}>{label}</Text>
          <Detail text={NOT_IN_BUDGET} />
        </View>
        <Bar spent={line.spent} plan={null} />
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.sm }}>
          <Text style={{ color: c.ink, fontFamily: fonts.type, fontSize: size.small, fontVariant: ["tabular-nums"] }}>{wholeMoney(line.spent, view.currency)} spent</Text>
          <AddBack label={label} onAdd={(report) => act.needed(line.line, true, report)} />
        </View>
      </View>
    </View>
  );
}

export function AddBack({ label, onAdd }: { label: string; onAdd: (report: Report) => void }) {
  const { busy, problem, run } = useSaving();
  return (
    <View style={{ flexShrink: 1, alignItems: "flex-end", gap: 2 }}>
      <Pressable onPress={() => run(onAdd)} disabled={busy} hitSlop={14} accessibilityRole="button" accessibilityState={{ busy }} accessibilityLabel={`Add ${label} back`}>
        <Small tone="pen">{busy ? "Add back…" : "Add back"}</Small>
      </Pressable>
      {problem ? <Body tone="red">{problem}</Body> : null}
    </View>
  );
}
