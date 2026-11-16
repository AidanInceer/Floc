import { Sheet } from "@/components/system/client-ui";
import { iconButtonClass } from "@/components/system/ui";
import { FitBadge, ProgressBadge, SpendBar } from "@/components/money/estimate/estimate-marks";
import { SpendLineIcon } from "@/components/system/icons/spend-line";
import { BudgetForm, HomeAirportForm, LineForm, NightsForm } from "@/components/money/estimate/estimate-forms";
import { StyleForm } from "@/components/money/estimate/style-form";
import type { EstimateView } from "@/server/money/estimate/estimate-view";
import { lineDetail, styleSentence } from "@floc/core/money/estimate/line-words";
import { LINE_LABELS } from "@floc/core/money/estimate/lines";
import type { PlanLine } from "@floc/core/money/estimate/plan";
import { fitWords, progressWords, wholeMoney, wholeRange } from "@floc/core/money/estimate/words";

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
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2.5 px-6 pb-2 pt-3.5 max-sm:gap-x-5 max-sm:px-4">
        <Figure label="Budget">{plan.budget == null ? budgetSheet("Set a budget", false) : <>{money(plan.budget)}{budgetSheet(PENCIL, true)}</>}</Figure>
        <Figure label="Spent">{money(plan.spent)}</Figure>
        <Figure label="Left">{plan.left == null ? "—" : money(plan.left)}</Figure>
        <Figure label="Estimate">{view.places ? wholeRange(plan.total, currency) : "—"}</Figure>
        {plan.fit ? <span className="ml-auto max-sm:ml-0 max-sm:basis-full"><FitBadge fit={plan.fit} words={fitWords(plan.fit, currency)} /></span> : null}
      </div>
      <div className="px-6 max-sm:px-4">
        <SpendBar thin spent={plan.spent} plan={view.places ? plan.total : null} budget={plan.budget} label={`Spent ${money(plan.spent)} of an estimated ${wholeRange(plan.total, currency)}`} />
      </div>
    </div>
  );
}

const ROW = "grid grid-cols-[26px_minmax(160px,1fr)_minmax(140px,220px)_230px_26px] items-center gap-3.5 border-b border-rule py-3 pl-6 pr-4 text-[15px] max-sm:grid-cols-[26px_1fr_26px] max-sm:gap-x-2.5 max-sm:gap-y-1.5 max-sm:pl-4 max-sm:pr-4";
const BAR_CELL = "max-sm:col-span-2 max-sm:col-start-2 max-sm:row-start-2";
const FIGURE_CELL = "grid justify-items-end gap-1 text-[13px] max-sm:col-span-2 max-sm:col-start-2 max-sm:row-start-3 max-sm:flex max-sm:items-center max-sm:justify-between";
const linkTrigger = "text-[13px] text-pen hover:underline";

function Detail({ text }: { text: string }) {
  return <small className="text-[13px] text-ink-faint">{text.split(" · ").join("\u00a0· ")}</small>;
}

function LineRow({ tripId, view, line }: { tripId: number; view: EstimateView; line: PlanLine }) {
  const { currency } = view;
  const words = progressWords(line.progress, currency);
  const needsHome = line.line === "flights" && line.missing === "home" && !line.plan;
  return (
    <li className={ROW}>
      <SpendLineIcon line={line.line} />
      <span className="grid min-w-0 gap-0.5">
        {LINE_LABELS[line.line]}
        <Detail text={lineDetail({ ...line, range: line.plan }, { style: view.style, nights: view.nights.count })} />
      </span>
      <span className={BAR_CELL}>
        <SpendBar spent={line.spent} plan={line.plan} label={`${LINE_LABELS[line.line]}: ${words}`} />
      </span>
      <span className={FIGURE_CELL}>
        {line.plan ? <span className="font-mono text-ink">{wholeMoney(line.spent, currency)} of {wholeRange(line.plan, currency)}{line.own != null ? <span className="font-sans text-ink-faint"> · yours</span> : null}</span> : null}
        {needsHome ? (
          <Sheet title="Where do you fly from?" trigger="Add home airport" triggerVariant="secondary"><HomeAirportForm suggested={null} /></Sheet>
        ) : (
          <ProgressBadge progress={line.progress} words={words} />
        )}
      </span>
      {needsHome ? <span /> : (
        <Sheet title={LINE_LABELS[line.line]} trigger={PENCIL} bareTrigger triggerClassName={`${iconButtonClass(false)} max-sm:col-start-3 max-sm:row-start-1`} triggerLabel={`Change ${LINE_LABELS[line.line].toLowerCase()}`}>
          <LineForm tripId={tripId} line={line} currency={currency} />
        </Sheet>
      )}
    </li>
  );
}

function OtherRow({ amount, currency }: { amount: number; currency: EstimateView["currency"] }) {
  return (
    <li className={ROW}>
      <SpendLineIcon line="other" />
      <span className="grid min-w-0 gap-0.5">Other<Detail text="Shopping, health, fees and the rest" /></span>
      <span className={BAR_CELL} />
      <span className={FIGURE_CELL}><span className="font-mono text-ink">{wholeMoney(amount, currency)} spent</span></span>
      <span />
    </li>
  );
}

function Footer({ tripId, view }: { tripId: number; view: EstimateView }) {
  const from = view.home ? `${view.home.name}${view.home.inferred ? " (from your flight files)" : ""}` : null;
  const assumed = view.nights.from === "assumed" || view.nights.from === "chosen";
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3 text-[13px] text-ink-soft max-sm:px-4">
      <span>{styleSentence(view.style, from)}{view.style.tripOnly ? " · this trip only" : ""}</span>
      <Sheet title="How you travel on this trip" trigger="Change" bareTrigger triggerClassName={linkTrigger}>
        <StyleForm tripId={tripId} style={view.style} />
      </Sheet>
      {assumed ? (
        <Sheet title="How many nights?" trigger={`${view.nights.count} nights`} bareTrigger triggerClassName={linkTrigger}>
          <NightsForm tripId={tripId} nights={view.nights.count} />
        </Sheet>
      ) : null}
      {view.home?.inferred ? (
        <Sheet title="Where do you fly from?" trigger="Confirm airport" bareTrigger triggerClassName={linkTrigger}>
          <HomeAirportForm suggested={view.home.code} />
        </Sheet>
      ) : null}
    </div>
  );
}

export function BudgetPanel({ tripId, view }: { tripId: number; view: EstimateView }) {
  const { plan, currency } = view;
  return (
    <section aria-label="Your budget" className="overflow-hidden rounded-md border border-rule bg-sheet shadow-card">
      <Summary tripId={tripId} view={view} />
      <ul>
        {plan.lines.map((line) => <LineRow key={line.line} tripId={tripId} view={view} line={line} />)}
        {plan.other > 0 ? <OtherRow amount={plan.other} currency={currency} /> : null}
      </ul>
      <Footer tripId={tripId} view={view} />
    </section>
  );
}
