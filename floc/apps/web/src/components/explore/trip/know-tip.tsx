import type { KnowLink } from "@floc/core/trip/explore/know/know-types";
import { figureParts } from "@floc/core/trip/explore/know/figure-parts";

import { KnowGlyphIcon, type KnowGlyphName } from "@/components/system/icons/know";

export type TipRow = { icon: KnowGlyphName; place?: string; title: string; text: string; link?: KnowLink; temporary?: string };

function Figures({ text }: { text: string }) {
  return figureParts(text).map((part, i) =>
    part.figure ? (
      <span key={i} className="nums whitespace-nowrap text-[0.9em] tracking-[-0.02em] text-ink">
        {part.text}
      </span>
    ) : (
      part.text
    ),
  );
}

export function KnowTipRow({ tip }: { tip: TipRow }) {
  return (
    <li className="grid grid-cols-[28px_minmax(0,1fr)] items-start gap-3.5 border-t border-rule py-3.5">
      <span className="grid size-7 place-items-center rounded-sm bg-sheet-2 text-ink-soft">
        <KnowGlyphIcon name={tip.icon} />
      </span>
      <div className="grid gap-[3px] pt-[3px]">
        {tip.place ? <span className="text-[12.5px] text-ink-faint">{tip.place}</span> : null}
        <b className="text-base leading-snug">
          <Figures text={tip.title} />
        </b>
        <p className="text-sm leading-relaxed text-ink-soft">
          <Figures text={tip.text} />
        </p>
        {tip.temporary ? (
          <span className="mt-0.5 inline-flex items-center gap-1.5 py-0.5 text-[12.5px] text-ink-faint">
            <KnowGlyphIcon name="clock" size={12} />
            Temporary · {tip.temporary}
          </span>
        ) : null}
        {tip.link ? (
          <a
            href={tip.link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 inline-flex items-center gap-1.5 justify-self-start text-sm text-pen hover:underline hover:underline-offset-2"
          >
            {tip.link.label}
            <span className="sr-only"> (opens in a new tab)</span>
            <KnowGlyphIcon name="external" />
          </a>
        ) : null}
      </div>
    </li>
  );
}
