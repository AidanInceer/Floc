import { updateCurrency, updatePacking } from "@/app/profile/actions";
import { SegmentTrack } from "@/components/system/segment-track";
import { Select, cx, trackRadioClass } from "@/components/system/ui";
import { CURRENCIES, currencyOptionLabel, type Currency } from "@floc/core/money/currency";
import { PACK_TIERS, PACK_TIER_LABELS, type PackTier } from "@floc/core/packing/packing";

import { AutoSaveForm } from "./auto-save-form";

const rowClass = "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2";
const stackOnPhone = "max-sm:grid-cols-1";

export function TripsFields({
  packTier,
  homeCurrency,
}: {
  packTier: PackTier;
  homeCurrency: Currency;
}) {
  return (
    <>
      <AutoSaveForm action={updatePacking} className="flex flex-col gap-4">
        <div className={cx(rowClass, stackOnPhone)}>
          <span id="pack-tier" className="text-sm">How much you pack</span>
          <SegmentTrack role="radiogroup" aria-labelledby="pack-tier" className="flex gap-0.5">
            {PACK_TIERS.map((t) => (
              <label key={t} className="min-w-0 flex-1">
                <input type="radio" name="packTier" value={t} defaultChecked={t === packTier} className="peer sr-only" />
                <span className={cx(trackRadioClass, "px-3.5 py-1.5 text-sm")}>
                  {PACK_TIER_LABELS[t]}
                </span>
              </label>
            ))}
          </SegmentTrack>
        </div>
      </AutoSaveForm>

      <AutoSaveForm action={updateCurrency}>
        <label className={cx(rowClass, stackOnPhone)}>
          <span className="text-sm">Home currency</span>
          <Select name="homeCurrency" defaultValue={homeCurrency} className="sm:w-40">
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {currencyOptionLabel(c)}
              </option>
            ))}
          </Select>
        </label>
      </AutoSaveForm>
    </>
  );
}
