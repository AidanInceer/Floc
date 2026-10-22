import { AvatarRow } from "@/components/system/ui";
import { PRO_FEATURES, PRO_STAGES, PRO_TABS, type ProFeatureKey } from "@/lib/landing/pro-tour";

import { Glyph } from "../landing-glyph";
import { sampleGroup } from "../sample-trip";
import { FEATURE_GLYPH } from "./pro-glyphs";

/** One job: a dashed copy of the tab it replaces holds the place until the tab lands, then the job shows done. */
function ProLine({ k, done }: { k: ProFeatureKey; done: boolean }) {
  const f = PRO_FEATURES[k];
  return (
    <li data-slot={k} data-done={done || undefined} className="pro-line">
      <span aria-hidden className="pro-from">
        <span data-chip className="pro-chip">
          <b className="pro-fav" data-tone={f.tone}>
            {f.fav}
          </b>
          <span>{f.tab}</span>
        </span>
      </span>
      <div className="pro-got">
        <span className="pro-tile" data-tone={f.tone}>
          <Glyph name={FEATURE_GLYPH[k]} className="size-3.5" />
        </span>
        <span className="grid min-w-0">
          <b>{f.title}</b>
          <span className="pro-val nums">{f.pro}</span>
        </span>
      </div>
    </li>
  );
}

/** The group's trip as one ticket, a stub per stage. */
export function ProTicket({ done }: { done: number }) {
  return (
    <div className="pro-ticket">
      <header className="pro-ticket-top">
        <h3 className="font-display text-xl font-semibold tracking-tight md:text-2xl">Sicily</h3>
        <span className="nums text-sm text-ink-faint">12–19 Sep</span>
        <span className="ml-auto">
          <AvatarRow people={sampleGroup} max={6} size={22} />
        </span>
      </header>
      <div className="pro-stubs">
        {PRO_STAGES.map((stage) => (
          <section key={stage.name} className="pro-stub">
            <h4 className="mb-2.5 font-display text-[15px] font-semibold">{stage.name}</h4>
            <ul>
              {stage.keys.map((key) => (
                <ProLine key={key} k={key} done={PRO_TABS.indexOf(key) < done} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
