import type { ReactNode } from "react";

import { cx } from "@/components/system/ui";

import { Glyph } from "./landing-glyph";
import { MoneyScreen, TodayScreen } from "./phone-screens";

function Phone({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cx("absolute h-[560px] w-[290px] rounded-[42px] bg-phone-frame p-2.5 shadow-lifted", className)}>
      <div className="flex h-full flex-col gap-1.5 overflow-hidden rounded-[33px] bg-paper px-4 pb-4 pt-9">{children}</div>
    </div>
  );
}

function Store({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-dashed border-rule-strong px-4 py-2.5 text-sm text-ink-soft">
      <Glyph name="app" className="size-[14px]" />
      {name}
      <small className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-faint">soon</small>
    </span>
  );
}

/** The phone apps are not out yet, so this band has no action — only what is coming and the link that works today. */
export function AppBand() {
  return (
    <section className="overflow-hidden px-4 py-24 sm:px-6">
      <div className="mx-auto grid max-w-[72rem] items-center gap-16 md:grid-cols-2 xl:grid-cols-[580px_minmax(0,1fr)]">
        <div className="relative h-[580px]" role="img" aria-label="Floc on a phone: today's plan in Cefalù, and what you owe">
          <Phone className="left-0 top-2.5 z-[2] -rotate-[4deg]">
            <TodayScreen />
          </Phone>
          <Phone className="left-[272px] top-[50px] hidden rotate-[5deg] xl:block">
            <MoneyScreen />
          </Phone>
        </div>
        <div>
          <h2 className="band-title">The plan in your pocket.</h2>
          <p className="mt-5 max-w-[46ch] text-md text-ink-soft">
            Today&rsquo;s plan, who owes who and what to bring. On the web now; the apps are coming.
          </p>
          <div className="max-w-[30rem]">
            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              <Store name="App Store" />
              <Store name="Google Play" />
            </div>
            <div className="mt-7 flex items-start gap-3 rounded-lg border border-rule bg-sheet px-[18px] py-4 text-sm text-ink-soft">
              <Glyph name="link" className="mt-[3px] size-[14px] shrink-0" />
              <p>
                <b className="text-ink">Got a trip link?</b> Preview it before signing up.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
