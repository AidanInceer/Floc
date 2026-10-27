import Link from "next/link";

import { ProTour } from "./pro-tour";
import { ComingSoonTag } from "../coming-soon-tag";

/** `monthly` is Stripe's formatted price; null when it cannot be read, so Pro sells without a figure. */
function ProPitch({ monthly, href }: { monthly: string | null; href: string }) {
  return (
    <div className="grid items-center gap-4 border-t border-rule bg-sheet p-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-6 md:px-6 md:py-[18px]">
      <span aria-hidden className="hidden items-center gap-1.5 md:flex">
        <span className="font-display text-[22px] font-semibold leading-none tracking-tight text-ink">
          floc<span className="text-pen">.</span>
        </span>
        <b className="rounded-[5px] bg-pro-mark px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-pro">Pro</b>
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
        <Link href={href} className="lift rounded-full bg-pro-mark px-6 py-3 text-sm font-semibold text-pro">
          Get Pro
        </Link>
      </div>
    </div>
  );
}

/** The sample trip planned in eleven tabs; each closes onto the job Pro does. Some of it is still coming, which the tag says once. */
export function ProBand({ monthly, signedIn }: { monthly: string | null; signedIn: boolean }) {
  return (
    <div>
      <div className="grid justify-items-center text-center">
        <ComingSoonTag />
        <h2 className="band-title mt-3">How Pro helps at every stage.</h2>
      </div>
      <ProTour>
        <ProPitch monthly={monthly} href={signedIn ? "/settings?section=billing" : "/signup"} />
      </ProTour>
    </div>
  );
}
