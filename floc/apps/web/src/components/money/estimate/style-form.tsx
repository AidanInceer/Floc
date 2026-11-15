import { ActionForm, SubmitButton } from "@/components/system/client-ui";
import { cx, FieldGroup, segmentTrack } from "@/components/system/ui";
import {
  CABIN_LABELS, CABINS, PACE_LABELS, PACES, STAY_LABELS, STAY_STYLES, type TravelStyle,
} from "@floc/core/money/estimate/style";
import { saveStyleForm, resetTripStyle } from "@/app/trip/[id]/money/estimate-actions";

function Choice<T extends string>({ name, label, options, labels, value }: { name: string; label: string; options: readonly T[]; labels: Record<T, string>; value: T }) {
  return (
    <FieldGroup label={label}>
      <div className={cx("flex flex-wrap gap-1", segmentTrack)}>
        {options.map((o) => (
          <label
            key={o}
            className="cursor-pointer rounded-sm px-3 py-1 text-[13px] text-ink-soft transition-colors hover:bg-pen-soft hover:text-pen-deep has-[:checked]:bg-pen-soft has-[:checked]:text-pen-deep has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-pen"
          >
            <input type="radio" name={name} value={o} defaultChecked={o === value} className="sr-only" />
            {labels[o]}
          </label>
        ))}
      </div>
    </FieldGroup>
  );
}

/** How you travel on this trip only (#574): a change here never moves your profile's default. */
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
