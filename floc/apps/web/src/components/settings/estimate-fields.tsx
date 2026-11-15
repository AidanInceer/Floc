/** Where you fly from and how you travel, for your own cost estimates (#574, ADR-057). Pro; a change on a trip stays on that trip. */
import Link from "next/link";

import { saveHomeAirportForm, saveTravelStyleForm } from "@/app/trip/[id]/money/estimate-actions";
import { ActionForm, SubmitButton } from "@/components/system/client-ui";
import { ChoiceSegments } from "@/components/system/choice-segments";
import { buttonClass, Input } from "@/components/system/ui";
import { airportName } from "@floc/core/money/estimate/guide/home-airport";
import {
  CABIN_LABELS, CABINS, PACE_LABELS, PACES, STAY_LABELS, STAY_STYLES,
} from "@floc/core/money/estimate/style";
import type { EstimateSettings } from "@floc/core/money/estimate/view";

import { AutoSaveForm } from "./auto-save-form";
import { SettingsRow } from "./settings-row";
import { estimateSummary } from "@floc/core/money/estimate/line-words";

const rowClass = "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 max-sm:grid-cols-1";

function Choice<T extends string>({ name, label, options, labels, value }: { name: string; label: string; options: readonly T[]; labels: Record<T, string>; value: T }) {
  return (
    <div className={rowClass}>
      <span id={`est-${name}`} className="text-sm">{label}</span>
      <ChoiceSegments name={name} labelledBy={`est-${name}`} options={options} labels={labels} value={value} />
    </div>
  );
}


function EstimateFields({ settings }: { settings: EstimateSettings }) {
  if (!settings.pro) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">Your home airport and travel style shape your own cost estimate on each trip. A Floc Pro feature.</p>
        <Link href="/profile?section=billing#settings-billing" className={buttonClass("pro")}>See Floc Pro</Link>
      </div>
    );
  }
  const { homeAirport, inferred, style } = settings;
  return (
    <div className="flex flex-col gap-4">
      {!homeAirport && inferred ? (
        <ActionForm action={saveHomeAirportForm} className={rowClass}>
          <input type="hidden" name="airport" value={inferred} />
          <span className="text-sm">We think you fly from {airportName(inferred)} ({inferred}).</span>
          <SubmitButton variant="secondary">Confirm</SubmitButton>
        </ActionForm>
      ) : null}
      <ActionForm action={saveHomeAirportForm} className={rowClass} keepAnswers>
        <label htmlFor="est-airport" className="text-sm">
          Home airport
          {homeAirport ? <span className="block text-xs text-ink-faint">{airportName(homeAirport)}</span> : null}
        </label>
        <span className="flex items-center gap-2">
          <Input id="est-airport" name="airport" maxLength={3} autoComplete="off" defaultValue={homeAirport ?? undefined} className="w-20 font-mono uppercase" />
          <SubmitButton variant="secondary">Save</SubmitButton>
        </span>
      </ActionForm>
      <AutoSaveForm action={saveTravelStyleForm} className="flex flex-col gap-4">
        <Choice name="cabin" label="Cabin" options={CABINS} labels={CABIN_LABELS} value={style.cabin} />
        <Choice name="stay" label="Stay" options={STAY_STYLES} labels={STAY_LABELS} value={style.stay} />
        <Choice name="pace" label="Pace" options={PACES} labels={PACE_LABELS} value={style.pace} />
      </AutoSaveForm>
    </div>
  );
}

export function EstimateRow({ id, open, settings }: { id: string; open: boolean; settings: EstimateSettings }) {
  return (
    <SettingsRow id={id} open={open} title="Budgeting" summary={settings.pro ? estimateSummary(settings.homeAirport, settings.style) : "Floc Pro"}>
      <EstimateFields settings={settings} />
    </SettingsRow>
  );
}
