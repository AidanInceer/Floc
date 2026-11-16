import { ActionForm, SubmitButton } from "@/components/system/client-ui";
import { Field, Input } from "@/components/system/ui";
import { toMajorInput } from "@floc/core/money/money";
import type { Currency } from "@floc/core/money/currency";
import { chosenAirport } from "@floc/core/money/estimate/guide/airports/airports";

import { AirportField } from "./airport-field";
import type { PlanLine } from "@floc/core/money/estimate/plan";
import { wholeRange } from "@floc/core/money/estimate/words";
import {
  saveBudgetForm,
  saveHomeAirportForm,
  saveLineForm,
  saveNightsForm,
} from "@/app/trip/[id]/money/estimate-actions";

// Why: a field starts empty unless it holds the person's own earlier answer (design card).
const shown = (minor: number | null, currency: Currency) => (minor == null ? undefined : toMajorInput(minor, currency));
const moneyField = "font-mono";

export function BudgetForm({ tripId, budget, currency }: { tripId: number; budget: number | null; currency: Currency }) {
  return (
    <ActionForm action={saveBudgetForm.bind(null, tripId)} className="grid gap-4" keepAnswers>
      <Field label={`For the whole trip, ${currency}`} hint="Only you see it.">
        <Input name="amount" inputMode="decimal" autoComplete="off" defaultValue={shown(budget, currency)} className={moneyField} />
      </Field>
      <div className="flex justify-end gap-2">
        <SubmitButton>Save budget</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function LineForm({ tripId, line, currency }: { tripId: number; line: PlanLine; currency: Currency }) {
  return (
    <div className="grid gap-4">
      <p className="text-[13px] text-ink-soft">
        Floc&rsquo;s guide: <span className="font-mono text-ink">{line.guide ? wholeRange(line.guide, currency) : "none yet"}</span>
      </p>
      <ActionForm action={saveLineForm.bind(null, tripId)} className="grid gap-4" keepAnswers>
        <input type="hidden" name="line" value={line.line} />
        <Field label={`Your figure, ${currency}`}>
          <Input name="figure" inputMode="decimal" autoComplete="off" defaultValue={shown(line.own, currency)} className={moneyField} />
        </Field>
        <Field label={`Budget for this line, ${currency}`}>
          <Input name="budget" inputMode="decimal" autoComplete="off" defaultValue={shown(line.budget, currency)} className={moneyField} />
        </Field>
        <div className="flex justify-end">
          <SubmitButton>Save</SubmitButton>
        </div>
      </ActionForm>
    </div>
  );
}

export function NightsForm({ tripId, nights }: { tripId: number; nights: number }) {
  return (
    <ActionForm action={saveNightsForm.bind(null, tripId)} className="grid gap-4" keepAnswers>
      <Field label="Nights" hint={`Now ${nights}.`}>
        <Input name="nights" type="number" min={1} max={365} className={moneyField} />
      </Field>
      <div className="flex justify-end">
        <SubmitButton>Save nights</SubmitButton>
      </div>
    </ActionForm>
  );
}

/** Your home airport. A guess from your flight files is offered as a Confirm, never typed into the field for you. */
export async function HomeAirportForm({ suggested }: { suggested: string | null }) {
  return (
    <div className="grid gap-4">
      {suggested ? (
        <ActionForm action={saveHomeAirportForm} className="flex flex-wrap items-center justify-between gap-3">
          <input type="hidden" name="airport" value={suggested} />
          <span className="text-[13px] text-ink-soft">We think you fly from {(await chosenAirport(suggested))?.label}.</span>
          <SubmitButton variant="secondary">Confirm</SubmitButton>
        </ActionForm>
      ) : null}
      <ActionForm action={saveHomeAirportForm} keepAnswers>
        <label htmlFor="budget-airport" className="typed mb-1 block">Home airport</label>
        <AirportField id="budget-airport" chosen={null} describedBy="budget-airport-hint" />
        <span id="budget-airport-hint" className="mt-1 block text-xs text-ink-faint">Kept on your profile.</span>
      </ActionForm>
    </div>
  );
}
