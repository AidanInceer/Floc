import { AvatarRow } from "@/components/system/ui";
import { PRO_FEATURES, type ProStage } from "@/lib/landing/pro-tour";

import { Glyph } from "../landing-glyph";
import { sampleGroup } from "../sample-trip";
import { FEATURE_GLYPH } from "./pro-glyphs";

/** One trip page at a stage. The Pro one sits on top, clipped to the wiper; `lit` marks the rows the wiper has passed. */
export function ProPage({ stage, lit }: { stage: ProStage; lit?: boolean[] }) {
  const pro = lit !== undefined;
  return (
    <div data-layer={pro ? "pro" : "free"} className="pro-layer col-start-1 row-start-1 px-3.5 pb-2 pt-4 md:px-[18px] md:pb-1.5 md:pt-3.5">
      <div className="flex items-center justify-between">
        <span className="typed">Sicily · 12–19 Sep</span>
        <AvatarRow people={sampleGroup} max={6} size={20} />
      </div>
      <b className="mb-2 mt-0.5 block font-display text-[21px] font-semibold tracking-[-0.02em]">{stage.what}</b>
      <ul>
        {stage.keys.map((key, i) => {
          const f = PRO_FEATURES[key];
          return (
            <li
              key={key}
              data-tone={f.tone}
              data-lit={lit?.[i] || undefined}
              className="pro-row relative grid grid-cols-[28px_minmax(0,1fr)_14px] items-center gap-x-2.5 gap-y-0.5 border-t border-rule py-[7px] md:min-h-[46px] md:grid-cols-[28px_auto_minmax(0,1fr)_16px] md:gap-3 md:py-0"
            >
              <span className="pro-tile row-span-2 md:row-span-1">
                <Glyph name={FEATURE_GLYPH[key]} className="size-3.5" />
              </span>
              <span className="font-medium">{f.row}</span>
              <span className="pro-val nums max-md:col-start-2 max-md:row-start-2 max-md:text-[12.5px]">{pro ? f.pro : f.free}</span>
              {pro && <Glyph name="star" className="pro-star size-[13px] fill-current max-md:col-start-3 max-md:row-span-2 max-md:row-start-1" />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
