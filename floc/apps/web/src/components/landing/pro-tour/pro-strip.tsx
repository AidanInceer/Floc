import { PRO_FEATURES, PRO_TABS, tabsOpen } from "@/lib/landing/pro-tour";

import { Glyph } from "../landing-glyph";

function ClosedPile() {
  return (
    <span className="pro-pile">
      <span className="flex">
        {PRO_TABS.map((key) => (
          <b key={key} className="pro-fav" data-tone={PRO_FEATURES[key].tone}>
            {PRO_FEATURES[key].fav}
          </b>
        ))}
      </span>
      <span className="nums">{PRO_TABS.length} tabs closed</span>
    </span>
  );
}

/** The planner's browser top: Floc's tab, a tab for every job Pro does, the tab count and the address. */
export function ProStrip({ closed, piled }: { closed: number; piled: boolean }) {
  const open = tabsOpen(closed);
  return (
    <div aria-hidden>
      <div className="pro-strip">
        <span className="pro-dots">
          <i />
          <i />
          <i />
        </span>
        <div className="pro-tabs">
          <span className="pro-tab pro-floc" data-alone={piled || undefined}>
            <b className="pro-fav">f</b>
            <span>Sicily · Floc</span>
          </span>
          {piled && <ClosedPile />}
          {PRO_TABS.map((key, i) => (
            <span key={key} data-tab={key} data-gone={i < closed || undefined} className="pro-tab">
              <b className="pro-fav" data-tone={PRO_FEATURES[key].tone}>
                {PRO_FEATURES[key].fav}
              </b>
              <span>{PRO_FEATURES[key].tab}</span>
              <Glyph name="close" className="pro-x" />
            </span>
          ))}
        </div>
        {/* Keyed by the count, so each close bumps it. */}
        <span key={open} className="pro-count nums">
          {open}
        </span>
      </div>
      <div className="pro-bar">
        <span className="pro-url">floc.app/trip/sicily</span>
      </div>
    </div>
  );
}
