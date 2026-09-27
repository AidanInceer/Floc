import Link from "next/link";

import { Glyph } from "../landing-glyph";
import { ProTour } from "./pro-tour";

/** `monthly` is Stripe's formatted price; null when it cannot be read, so Pro sells without a figure. */
function ProPitch({ monthly, href }: { monthly: string | null; href: string }) {
  return (
    <div className="mt-10 grid items-center gap-6 rounded-3xl border border-pro-edge bg-pro px-6 py-[22px] text-pro-ink md:grid-cols-[auto_minmax(0,1fr)_auto] md:px-[26px]">
      <span
        aria-hidden
        className="grid size-[74px] place-items-center content-center gap-0.5 rounded-full border-[1.5px] border-pro-edge bg-pro-2 text-pro-gold outline-1 outline-offset-4 outline-pro-edge outline-dashed"
      >
        <Glyph name="star" className="size-[18px] fill-current" />
        <b className="font-mono text-[11px] uppercase tracking-[0.12em]">Pro</b>
      </span>
      <div>
        <h3 className="font-display text-xl font-semibold tracking-tight">One Pro covers the whole trip.</h3>
        <p className="mt-1 max-w-[60ch] text-pro-ink-soft">
          Whoever gets it, everyone on that trip gets the extras. The vote, dates, route, money and packing stay free.
        </p>
      </div>
      <div className="flex items-center justify-between gap-[18px]">
        {monthly && (
          <p className="text-sm leading-snug md:text-right">
            <span className="nums text-lg font-medium">{monthly}</span> a month
            <br />
            <span className="text-pro-ink-soft">Cancel any time</span>
          </p>
        )}
        <Link href={href} className="lift rounded-full bg-pro-gold px-6 py-3 text-sm font-semibold text-pro">
          Get Pro
        </Link>
      </div>
    </div>
  );
}

/** What Pro adds today and what is coming to it, shown across one sample trip. */
export function ProBand({ monthly, signedIn }: { monthly: string | null; signedIn: boolean }) {
  return (
    <div>
      <div className="text-center">
        <p className="typed">Pro</p>
        <h2 className="band-title mt-2">Watch Pro work through a trip.</h2>
      </div>
      <ProTour />
      <ProPitch monthly={monthly} href={signedIn ? "/settings?section=billing" : "/signup"} />
    </div>
  );
}
