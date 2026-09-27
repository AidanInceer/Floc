import { AvatarRow, cx } from "@/components/system/ui";
import { FlocWordmark } from "@/components/system/wordmark";
import { PRO_TABS, type ProFeatureKey, type ProRow, type ProStage, type StageNote } from "@/lib/landing/pro-tour";

import { Glyph } from "../landing-glyph";
import { sampleGroup } from "../sample-trip";
import { ProBadge } from "./pro-badge";
import { FEATURE_GLYPH } from "./pro-glyphs";

export type ScreenProps = { stage: ProStage; notes: StageNote[]; hot: ProFeatureKey | null };

const noteOf = (notes: StageNote[], key: ProFeatureKey) => notes.find((n) => n.key === key);
const rowBadge = "absolute right-2 top-2 size-4 text-[9px]";

function Banner({ stage, notes, hot }: ScreenProps) {
  if (!stage.banner) return null;
  const note = noteOf(notes, stage.banner.key);
  return (
    <div
      data-row={stage.banner.key}
      className={cx(
        "relative flex items-center gap-2 rounded-xl py-[9px] pl-3 pr-8 text-[12px] font-medium transition-colors",
        hot === stage.banner.key ? "bg-pro text-pro-ink" : "bg-ink text-paper",
      )}
    >
      <i className="pro-pulse size-[7px] shrink-0 rounded-full bg-pastel-green" />
      {stage.banner.text}
      {note && <ProBadge note={note} onDark={hot !== stage.banner.key} className="absolute right-2 top-1/2 size-4 -translate-y-1/2 text-[9px]" />}
    </div>
  );
}

function Detail({ row }: { row: ProRow }) {
  return (
    <span className="nums text-[11.5px] text-ink-soft">
      {row.detail}
      {row.action && (
        <span className="ml-1.5 inline-flex items-center gap-1 text-pen">
          {row.action} <Glyph name="arrow" className="size-3" />
        </span>
      )}
    </span>
  );
}

export function BrowserScreen({ stage, notes, hot }: ScreenProps) {
  return (
    <div data-device className="relative z-[1] min-h-[470px] overflow-hidden rounded-2xl border border-rule-strong bg-paper shadow-lifted">
      <div className="flex items-center gap-[5px] border-b border-rule bg-sheet-2 px-3 py-[9px]">
        {[0, 1, 2].map((i) => (
          <i key={i} className="size-2 rounded-full bg-rule-strong" />
        ))}
        <span className="nums mx-auto max-w-[260px] flex-1 rounded-full bg-sheet px-3 py-[3px] text-center text-[11px] text-ink-faint">
          floc · trips / sicily
        </span>
      </div>
      <div className="grid gap-3.5 px-5 pb-[22px] pt-[18px]">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="typed">{stage.over}</p>
            <h3 className="font-display text-[26px] font-semibold leading-[1.05] tracking-[-0.03em]">{stage.page}</h3>
          </div>
          <AvatarRow people={sampleGroup} max={6} size={24} />
        </div>
        <div className="flex gap-1 border-b border-rule pb-2.5">
          {PRO_TABS.map((t) => (
            <span key={t} className={cx("rounded-full px-2.5 py-[5px] text-[12px]", t === stage.tab ? "bg-ink text-paper" : "text-ink-soft")}>
              {t}
            </span>
          ))}
        </div>
        <Banner stage={stage} notes={notes} hot={hot} />
        <div key={stage.name} className="pro-rise grid grid-cols-2 gap-2.5">
          {stage.rows.map((row, i) => {
            const note = noteOf(notes, row.key);
            return (
              <div
                key={i}
                data-row={row.key}
                className={cx(
                  "relative grid grid-cols-[22px_1fr] content-start gap-x-2 gap-y-0.5 rounded-[14px] border border-rule px-3.5 py-3 text-[13px] transition-colors",
                  hot === row.key ? "bg-pro" : "bg-sheet",
                )}
              >
                <span className="row-span-2 grid size-[22px] place-items-center rounded-[7px] bg-sheet-2">
                  <Glyph name={FEATURE_GLYPH[row.key]} className="size-[13px]" />
                </span>
                <b className="pr-[18px] font-semibold">{row.title}</b>
                <Detail row={row} />
                {note && <ProBadge note={note} className={rowBadge} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function PhoneScreen({ stage, notes, hot }: ScreenProps) {
  return (
    <div className="relative z-[1] mx-auto h-[560px] w-[280px] rounded-[40px] bg-phone-frame p-2.5 shadow-lifted sm:h-[590px] sm:w-[300px] sm:rounded-[44px]">
      <div className="flex h-full flex-col gap-1 overflow-hidden rounded-[32px] bg-paper px-4 pb-4 pt-[26px] sm:rounded-[35px]">
        <div className="mb-3.5 flex min-h-[26px] items-center justify-between">
          <FlocWordmark />
          <AvatarRow people={sampleGroup} max={4} size={20} />
        </div>
        <div className="mb-2.5 empty:hidden">
          <Banner stage={stage} notes={notes} hot={hot} />
        </div>
        <p className="typed">{stage.over}</p>
        <h3 className="mb-3.5 font-display text-[30px] font-semibold leading-[1.05] tracking-[-0.03em]">{stage.title}</h3>
        <div key={stage.name} className="pro-rise flex flex-col rounded-2xl border border-rule bg-sheet">
          {stage.rows.map((row, i) => {
            const note = noteOf(notes, row.key);
            return (
              <div
                key={i}
                className={cx(
                  "relative flex flex-col gap-[3px] border-b border-rule px-3 py-[11px] text-[13px] transition-colors first:rounded-t-2xl last:rounded-b-2xl last:border-b-0",
                  hot === row.key && "bg-pro",
                )}
              >
                <span className="inline-flex items-center gap-1.5 pr-6">
                  <Glyph name={FEATURE_GLYPH[row.key]} className="size-[13px] shrink-0" />
                  {row.title}
                </span>
                <span className="pl-5">
                  <Detail row={row} />
                </span>
                {note && <ProBadge note={note} className={rowBadge} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
