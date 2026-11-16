import { ChoiceSegments } from "@/components/system/choice-segments";
import { ActionForm, SubmitButton } from "@/components/system/client-ui";
import {
  CABIN_LABELS, CABINS, PACE_LABELS, PACES, STAY_LABELS, STAY_STYLES, type TravelStyle,
} from "@floc/core/money/estimate/style";
import { saveStyleForm, resetTripStyle } from "@/app/trip/[id]/money/estimate-actions";

function Choice<T extends string>({ name, label, options, labels, value }: { name: string; label: string; options: readonly T[]; labels: Record<T, string>; value: T }) {
  const id = `trip-style-${name}`;
  return (
    <div className="grid gap-1">
      <span id={id} className="typed">{label}</span>
      <ChoiceSegments name={name} labelledBy={id} options={options} labels={labels} value={value} />
    </div>
  );
}

export function StyleForm({ tripId, style }: { tripId: number; style: TravelStyle & { tripOnly: boolean } }) {
  return (
    <div className="grid gap-4">
      <ActionForm action={saveStyleForm.bind(null, tripId)} className="grid gap-4" keepAnswers>
        <Choice name="cabin" label="Cabin" options={CABINS} labels={CABIN_LABELS} value={style.cabin} />
        <Choice name="stay" label="Stay" options={STAY_STYLES} labels={STAY_LABELS} value={style.stay} />
        <Choice name="pace" label="Pace" options={PACES} labels={PACE_LABELS} value={style.pace} />
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] text-ink-soft">{style.tripOnly ? "Set for this trip only." : "From your profile."}</span>
          <SubmitButton>Use for this trip</SubmitButton>
        </div>
      </ActionForm>
      {style.tripOnly ? (
        <ActionForm action={resetTripStyle.bind(null, tripId)} className="flex justify-end">
          <SubmitButton variant="ghost">Use my profile</SubmitButton>
        </ActionForm>
      ) : null}
    </div>
  );
}
