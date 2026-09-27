import type { CSSProperties } from "react";

import { cx } from "@/components/system/ui";
import { PRO_FEATURES, type ProFeatureKey, type StageNote } from "@/lib/landing/pro-tour";

import { Glyph } from "../landing-glyph";
import { ProBadge } from "./pro-badge";
import { FEATURE_GLYPH } from "./pro-glyphs";

type Props = {
  inPro: boolean;
  notes: StageNote[];
  onHot: (key: ProFeatureKey | null) => void;
  className?: string;
};

export function ProNotes({ inPro, notes, onHot, className }: Props) {
  return (
    <div className={cx("grid w-full content-start gap-3.5", className)}>
      <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft">
        <i className={cx("w-[26px] rounded", inPro ? "border-t-4 border-pen" : "border-t-[3px] border-dashed border-ink-faint")} />
        {inPro ? "In Pro now" : "Coming to Pro"}
      </span>
      <ul className="grid w-full gap-4 xl:max-w-[290px]">
        {notes.length === 0 && (
          <li className="rounded-2xl border border-rule px-4 py-3.5 text-sm text-ink-faint xl:text-right">Nothing in Pro here yet</li>
        )}
        {notes.map((note, i) => {
          const feature = PRO_FEATURES[note.key];
          return (
            <li
              key={note.key}
              data-note={note.key}
              data-soon={inPro ? undefined : ""}
              onMouseEnter={() => onHot(note.key)}
              onMouseLeave={() => onHot(null)}
              style={{ "--delay": `${i * 0.08}s` } as CSSProperties}
              className={cx(
                "pro-rise grid gap-1 rounded-2xl px-4 py-3 text-sm text-ink-soft sm:py-3.5",
                inPro ? "border border-pro-edge bg-pro-2" : "border-[1.5px] border-dashed border-rule-strong bg-sheet",
              )}
            >
              <span className="flex items-center gap-1.5 text-ink">
                <ProBadge note={note} className="size-[18px] text-[10px]" />
                <Glyph name={FEATURE_GLYPH[note.key]} className="size-[13px] shrink-0" />
                <b className="font-semibold">{feature.title}</b>
              </span>
              <span>{feature.line}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
