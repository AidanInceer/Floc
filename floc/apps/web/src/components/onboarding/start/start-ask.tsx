import type { ReactNode } from "react";

import { NavGlyph } from "@/components/system/icons/nav";
import { CheckIcon } from "@/components/system/icons";
import { cx, segmentTrack, trackSegmentClass } from "@/components/system/ui";
import { PinIcon } from "@/components/system/icons/onboarding";

function YesNo({ label, value, onAnswer }: { label: string; value: boolean | null; onAnswer: (value: boolean | null) => void }) {
  const press = (next: boolean) => onAnswer(value === next ? null : next);
  return (
    <span role="group" aria-label={label} className={cx(segmentTrack, "grid w-[10rem] shrink-0 grid-cols-2 gap-0.5 max-sm:w-full")}>
      <button type="button" aria-pressed={value === true} onClick={() => press(true)} className={cx(trackSegmentClass(value === true), "h-8 text-sm")}>Yes</button>
      <button type="button" aria-pressed={value === false} onClick={() => press(false)} className={cx(trackSegmentClass(value === false), "h-8 text-sm")}>Not yet</button>
    </span>
  );
}

function Row({ tile, children }: { tile: ReactNode; children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3 rounded-sm border border-rule bg-sheet p-2.5 pl-3">{tile}{children}</div>;
}

const tileClass = "grid size-[30px] shrink-0 place-items-center rounded-sm";

export function StartAsk({ listing, where, dates, onWhere, onDates }: {
  listing: { title: string; stops: string[] } | null;
  where: boolean | null;
  dates: boolean | null;
  onWhere: (value: boolean | null) => void;
  onDates: (value: boolean | null) => void;
}) {
  return (
    <div className="grid gap-2">
      {listing ? (
        <Row tile={<span className={cx(tileClass, "bg-pastel-blue text-pastel-blue-ink")}><PinIcon /></span>}>
          <span className="grid min-w-0 flex-1 gap-0.5">
            <span className="text-base text-ink">{listing.title}</span>
            <span className="text-xs text-ink-faint">{listing.stops.join(", ")}</span>
          </span>
          <span className="inline-flex items-center gap-1 font-mono text-xs text-pastel-green-ink"><CheckIcon size={11} />From Explore</span>
        </Row>
      ) : (
        <Row tile={<span className={cx(tileClass, "bg-pastel-blue text-pastel-blue-ink")}><PinIcon /></span>}>
          <span className="min-w-0 flex-1 text-base text-ink">Do you know where?</span>
          <YesNo label="Do you know where?" value={where} onAnswer={onWhere} />
        </Row>
      )}
      <Row tile={<span className={cx(tileClass, "bg-pastel-yellow text-pastel-yellow-ink")}><NavGlyph name="dates" /></span>}>
        <span className="min-w-0 flex-1 text-base text-ink">Do you have dates?</span>
        <YesNo label="Do you have dates?" value={dates} onAnswer={onDates} />
      </Row>
    </div>
  );
}
