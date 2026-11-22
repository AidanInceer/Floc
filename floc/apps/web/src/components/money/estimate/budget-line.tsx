"use client";

import { useState } from "react";

import { BAR_CELL, FIGURE_CELL, LINE_ROW, LineDetail } from "@/components/money/estimate/budget-row";
import { ProgressBadge, SpendBar } from "@/components/money/estimate/estimate-marks";
import { LineAmountField } from "@/components/money/estimate/line-amount-field";
import { useLineSave } from "@/components/money/estimate/use-line-save";
import { Menu } from "@/components/system/client-ui";
import { SpendLineIcon } from "@/components/system/icons/spend-line";
import { busyMark, menuItemClass } from "@/components/system/ui";
import type { Currency } from "@floc/core/money/currency";
import type { PlanLine } from "@floc/core/money/estimate/plan";
import type { TravelMode } from "@floc/core/money/estimate/travel";
import { AMOUNT_FIELD_WORDS, BUDGET_THIS_LINE, progressWords, wholeMoney, wholeRange, type AmountField } from "@floc/core/money/estimate/words";
import { toMajorInput } from "@floc/core/money/money";

function MenuAction({ onPick, children }: { onPick: () => void; children: React.ReactNode }) {
  return (
    <form onSubmit={(event) => { event.preventDefault(); onPick(); }}>
      <button type="submit" role="menuitem" className={`${menuItemClass} whitespace-nowrap`}>{children}</button>
    </form>
  );
}

function Figures({ line, currency, busy, homeAction }: { line: PlanLine; currency: Currency; busy: boolean; homeAction: React.ReactNode }) {
  return (
    <>
      {line.plan ? <span className="font-mono text-ink">{wholeMoney(line.spent, currency)} of {wholeRange(line.plan, currency)}{busyMark(busy)}</span> : null}
      {homeAction ?? <ProgressBadge progress={line.progress} words={progressWords(line.progress, currency)} />}
    </>
  );
}

export function BudgetLine({ tripId, line, currency, words, name, homeAction }: {
  tripId: number;
  line: PlanLine;
  currency: Currency;
  words: { label: string; detail: string; travel: TravelMode };
  name: React.ReactNode;
  homeAction?: React.ReactNode;
}) {
  const [editing, setEditing] = useState<AmountField | null>(null);
  const { save, pending, problem, clear } = useLineSave(tripId, line.line);
  const wantsFigure = line.missing === "travel" && !line.plan;
  const field = editing ?? (wantsFigure ? "figure" : null);
  const held = field === "budget" ? line.budget : line.own;
  const detail = editing && line.guide ? `Floc’s guide: ${wholeRange(line.guide, currency)}` : words.detail;
  const close = () => {
    clear();
    setEditing(null);
  };
  return (
    <li className={LINE_ROW}>
      <SpendLineIcon line={line.line} travel={words.travel} />
      <div className="grid min-w-0 gap-0.5">
        {name}
        <LineDetail text={detail} />
      </div>
      <span className={BAR_CELL}>
        <SpendBar spent={line.spent} plan={line.plan} budget={line.budget} label={`${words.label}: ${progressWords(line.progress, currency)}`} />
      </span>
      <span className={FIGURE_CELL} aria-busy={pending || undefined}>
        {field && line.spent > 0 ? <span className="font-mono text-ink">{wholeMoney(line.spent, currency)} spent</span> : null}
        {field ? (
          <LineAmountField
            key={field}
            words={AMOUNT_FIELD_WORDS[field]}
            currency={currency}
            initial={held == null ? "" : toMajorInput(held, currency)}
            state={{ focus: editing !== null, busy: pending }}
            onSave={(value) => save({ [field]: value }, () => setEditing(null))}
            onCancel={close}
          />
        ) : <Figures line={line} currency={currency} busy={pending} homeAction={homeAction} />}
        {problem ? <span role="alert" className="text-[13px] text-red">{problem}</span> : null}
      </span>
      <div className="max-sm:col-start-3 max-sm:row-start-1">
        <Menu label={`More for ${words.label}`}>
          <MenuAction onPick={() => setEditing("figure")}>Change figure</MenuAction>
          <MenuAction onPick={() => setEditing("budget")}>{BUDGET_THIS_LINE}</MenuAction>
          <MenuAction onPick={() => save({ notNeeded: "true" })}>Not needed on this trip</MenuAction>
        </Menu>
      </div>
    </li>
  );
}
