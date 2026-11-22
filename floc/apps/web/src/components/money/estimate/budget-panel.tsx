import { Sheet } from "@/components/system/client-ui";
import { Badge, iconButtonClass } from "@/components/system/ui";
import { AddBack } from "@/components/money/estimate/add-back";
import { BudgetLine } from "@/components/money/estimate/budget-line";
import { BAR_CELL, FIGURE_CELL, LINE_ROW, LineDetail } from "@/components/money/estimate/budget-row";
import { FitBadge, SpendBar } from "@/components/money/estimate/estimate-marks";
import { TravelPicker } from "@/components/money/estimate/travel-picker";
import { SpendLineGlyph, SpendLineIcon } from "@/components/system/icons/spend-line";
import { BudgetForm, HomeAirportForm, NightsForm } from "@/components/money/estimate/estimate-forms";
import { StyleForm } from "@/components/money/estimate/style-form";
import type { EstimateView } from "@/server/money/estimate/estimate-view";
import { lineDetail, styleSentence, withLineBudget } from "@floc/core/money/estimate/line-words";
import { isFlying, type PlanLine } from "@floc/core/money/estimate/plan";
import { awaitingWords, lineLabel, NOT_IN_BUDGET, removedLabel } from "@floc/core/money/estimate/travel";
import { fitWords, wholeMoney, wholeRange } from "@floc/core/money/estimate/words";

const PENCIL = (
  <svg viewBox="0 0 14 14" className="size-[13px]" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M9.4 2.6 11.4 4.6 5 11H3V9Z" />
  </svg>
);

function Figure({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="grid gap-0.5">
      <span className="text-[13px] text-ink-soft">{label}</span>
      <span className="flex items-center gap-1 font-mono text-[17px] text-ink">{children}</span>
    </span>
  );
}

function FitMark({ view }: { view: EstimateView }) {
  const { plan, currency } = view;
  if (plan.awaiting) return <Badge sentence>{awaitingWords(plan.awaiting)}</Badge>;
  return plan.fit ? <FitBadge fit={plan.fit} words={fitWords(plan.fit, currency)} /> : null;
}

function Summary({ tripId, view }: { tripId: number; view: EstimateView }) {
  const { plan, currency } = view;
  const money = (m: number) => wholeMoney(m, currency);
  const budgetSheet = (trigger: React.ReactNode, bare: boolean) => (
    <Sheet title="Your budget" trigger={trigger} bareTrigger={bare} triggerClassName={bare ? iconButtonClass(false) : undefined} triggerLabel={bare ? "Change budget" : undefined} triggerVariant="secondary">
      <BudgetForm tripId={tripId} budget={plan.budget} currency={currency} />
    </Sheet>
  );
  return (
    <div className="grid gap-2 border-b border-rule pb-[18px] max-sm:pb-3.5">
      <div className="flex flex-wrap items-start gap-x-8 gap-y-2.5 px-6 pb-2 pt-3.5 max-sm:gap-x-5 max-sm:px-4">
        <Figure label="Budget">{plan.budget == null ? budgetSheet("Set a budget", false) : <>{money(plan.budget)}{budgetSheet(PENCIL, true)}</>}</Figure>
        <Figure label="Spent">{money(plan.spent)}</Figure>
        <Figure label="Left">{plan.left == null ? "—" : money(plan.left)}</Figure>
        <Figure label="Estimate">{view.places ? wholeRange(plan.total, currency) : "—"}</Figure>
        {plan.fit || plan.awaiting ? <span className="ml-auto self-center max-sm:ml-0 max-sm:basis-full"><FitMark view={view} /></span> : null}
      </div>
      <div className="px-6 max-sm:px-4">
        <SpendBar thin spent={plan.spent} plan={view.places ? plan.total : null} budget={plan.budget} label={`Spent ${money(plan.spent)} of an estimated ${wholeRange(plan.total, currency)}`} />
      </div>
    </div>
  );
}

const linkTrigger = "text-[13px] text-pen hover:underline";

function PlannedRow({ tripId, view, line }: { tripId: number; view: EstimateView; line: PlanLine }) {
  const { travel } = view.plan;
  const label = lineLabel(line.line, travel);
  const detail = withLineBudget(lineDetail({ ...line, range: line.plan }, { style: view.style, nights: view.nights.count, travel }), line.budget, view.currency);
  const needsHome = line.line === "flights" && line.missing === "home" && !line.plan;
  return (
    <BudgetLine
      tripId={tripId}
      line={line}
      currency={view.currency}
      words={{ label, detail, travel }}
      name={line.line === "flights" ? <TravelPicker tripId={tripId} travel={travel} /> : label}
      homeAction={needsHome ? <Sheet title="Where do you fly from?" trigger="Add home airport" triggerVariant="secondary"><HomeAirportForm suggested={null} /></Sheet> : undefined}
    />
  );
}

function RemovedRow({ tripId, view, line }: { tripId: number; view: EstimateView; line: PlanLine }) {
  const label = removedLabel(line.line);
  const spent = wholeMoney(line.spent, view.currency);
  return (
    <li className={LINE_ROW}>
      <SpendLineIcon muted line={line.line} travel={view.plan.travel} />
      <span className="grid min-w-0 gap-0.5 text-ink-soft">{label}<LineDetail text={NOT_IN_BUDGET} /></span>
      <span className={BAR_CELL}><SpendBar spent={line.spent} plan={null} label={`${label}: ${spent} spent`} /></span>
      <span className={FIGURE_CELL}>
        <span className="font-mono text-ink">{spent} spent</span>
        <AddBack tripId={tripId} line={line.line} label={label} />
      </span>
      <span />
    </li>
  );
}

function OtherRow({ amount, currency }: { amount: number; currency: EstimateView["currency"] }) {
  return (
    <li className={LINE_ROW}>
      <SpendLineIcon line="other" />
      <span className="grid min-w-0 gap-0.5">Other<LineDetail text="Shopping, health, fees and the rest" /></span>
      <span className={`${BAR_CELL} max-sm:hidden`} />
      <span className={`${FIGURE_CELL} max-sm:row-start-2`}><span className="font-mono text-ink">{wholeMoney(amount, currency)} spent</span></span>
      <span />
    </li>
  );
}

function WaitingLines({ tripId, view }: { tripId: number; view: EstimateView }) {
  const waiting = view.plan.lines.filter((l) => !l.needed && l.spent === 0);
  if (waiting.length === 0) return null;
  return (
    <span className="ml-auto flex flex-wrap items-center gap-x-3.5 gap-y-1.5 max-sm:ml-0 max-sm:basis-full">
      <span>Not in your budget</span>
      {waiting.map((line) => (
        <span key={line.line} className="inline-flex items-center gap-1.5">
          <SpendLineGlyph line={line.line} travel={view.plan.travel} />
          {removedLabel(line.line)}
          <AddBack tripId={tripId} line={line.line} label={removedLabel(line.line)} />
        </span>
      ))}
    </span>
  );
}

function Footer({ tripId, view }: { tripId: number; view: EstimateView }) {
  const flying = isFlying(view.plan);
  const from = view.home ? `${view.home.name}${view.home.inferred ? " (from your flight files)" : ""}` : null;
  const assumed = view.nights.from === "assumed" || view.nights.from === "chosen";
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3 text-[13px] text-ink-soft max-sm:px-4">
      <span>{styleSentence(view.style, from, flying)}{view.style.tripOnly ? " · this trip only" : ""}</span>
      <Sheet title="How you travel on this trip" trigger="Change" bareTrigger triggerClassName={linkTrigger}>
        <StyleForm tripId={tripId} style={view.style} flying={flying} />
      </Sheet>
      {assumed ? (
        <Sheet title="How many nights?" trigger={`${view.nights.count} nights`} bareTrigger triggerClassName={linkTrigger}>
          <NightsForm tripId={tripId} nights={view.nights.count} />
        </Sheet>
      ) : null}
      {flying && view.home?.inferred ? (
        <Sheet title="Where do you fly from?" trigger="Confirm airport" bareTrigger triggerClassName={linkTrigger}>
          <HomeAirportForm suggested={view.home.code} />
        </Sheet>
      ) : null}
      <WaitingLines tripId={tripId} view={view} />
    </div>
  );
}

function LineRow({ tripId, view, line }: { tripId: number; view: EstimateView; line: PlanLine }) {
  if (line.needed) return <PlannedRow tripId={tripId} view={view} line={line} />;
  return line.spent > 0 ? <RemovedRow tripId={tripId} view={view} line={line} /> : null;
}

export function BudgetPanel({ tripId, view }: { tripId: number; view: EstimateView }) {
  const { plan, currency } = view;
  return (
    <section aria-label="Your budget" className="rounded-md border border-rule bg-sheet shadow-card">
      <Summary tripId={tripId} view={view} />
      <ul>
        {plan.lines.map((line) => <LineRow key={line.line} tripId={tripId} view={view} line={line} />)}
        {plan.other > 0 ? <OtherRow amount={plan.other} currency={currency} /> : null}
      </ul>
      <Footer tripId={tripId} view={view} />
    </section>
  );
}
