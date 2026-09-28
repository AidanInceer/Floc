import Link from "next/link";

import { Glyph } from "../landing-glyph";
import { ProTour } from "./pro-tour";

/** `monthly` is Stripe's formatted price; null when it cannot be read, so Pro sells without a figure. */
function ProPitch({ monthly, href }: { monthly: string | null; href: string }) {
  return (
    <div className="mt-9 grid items-center gap-4 rounded-3xl border border-rule bg-sheet p-4 shadow-raised md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-6 md:px-6 md:py-[18px]">
      <span
        aria-hidden
        className="hidden size-[60px] place-items-center content-center gap-0.5 rounded-full border-[1.5px] border-rule-strong text-pro-gold outline-1 outline-offset-4 outline-rule-strong outline-dashed md:grid"
      >
        <Glyph name="star" className="size-[15px] fill-current" />
        <b className="font-mono text-[11px] uppercase tracking-[0.12em]">Pro</b>
      </span>
      <div>
        <h3 className="font-display text-xl font-semibold tracking-tight">One Pro covers the whole trip.</h3>
        <p className="mt-1 max-w-[60ch] text-ink-soft">
          Whoever gets it, everyone on that trip gets the extras. The vote, dates, route, money and packing stay free.
        </p>
      </div>
      <div className="flex items-center justify-between gap-[18px] border-t border-rule pt-3.5 md:border-0 md:pt-0">
        {monthly && (
          <p className="text-sm leading-snug md:text-right">
            <span className="nums text-lg font-medium">{monthly}</span> a month
            <br />
            <span className="text-ink-faint">Cancel any time</span>
          </p>
        )}
        <Link href={href} className="lift rounded-full bg-pro-gold px-6 py-3 text-sm font-semibold text-pro">
          Get Pro
        </Link>
      </div>
    </div>
  );
}

/** The same sample trip without and with Pro, stage by stage. Some of it is still coming, which the tag says once. */
export function ProBand({ monthly, signedIn }: { monthly: string | null; signedIn: boolean }) {
  return (
    <div>
      <div className="grid justify-items-center text-center">
        <p className="rounded-full border border-dashed border-rule-strong px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-faint">
          Coming soon to Pro
        </p>
        <h2 className="band-title mt-2.5">How Pro helps at every stage.</h2>
      </div>
      <ProTour />
      <ProPitch monthly={monthly} href={signedIn ? "/settings?section=billing" : "/signup"} />
    </div>
  );
}
