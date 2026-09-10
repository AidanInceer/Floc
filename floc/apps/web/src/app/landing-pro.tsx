/**
 * The Pro block on `/` — split out of `page.tsx` (ticket 278) when the hero
 * gained its own Pro button and the landing page tipped over its complexity
 * ceiling. The one paid thing on the page, so it is the one block that refuses
 * the pale palette: parchment and gold in light, black and gold in dark.
 */
import Link from "next/link";

import type { ProPrice } from "@/server/billing/billing";
import { renewalLabel } from "@floc/core/subscription-copy";
import type { SubscriptionFacts } from "@floc/core/subscription-copy";
import { ProUpgrade } from "@/components/billing-buttons";
import { FlockChevron } from "@/components/flock-chevron";
import { Glyph, proLead, proPerks } from "./landing-content";
import type { Perk } from "./landing-content";

/** Nothing to sell while every feature is free — the whole block goes, rather
 * than a version of it that quotes no price. */
export function ProBlock({
  show,
  alreadyPro,
  proRow,
  prices,
  canBuy,
  billing,
}: {
  show: boolean;
  alreadyPro: boolean;
  proRow: SubscriptionFacts | null;
  prices: ProPrice[];
  canBuy: boolean;
  billing: string;
}) {
  if (!show) return null;

  return (
  <section className="mt-24">
            <div className="overflow-hidden rounded-lg bg-pro p-8 text-pro-ink sm:p-12">
              {/* The block runs down one centre line: name, then the reason the
                tier exists, then the perks, then the button. */}
              <div className="flex justify-center">
                <span className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-pro-gold px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-pro-gold">
                  <Glyph name="star" />
                  Floc Pro
                </span>
              </div>

              {/* The headline perk stands alone above the grid — it is the reason
                the tier exists, not one of eight equals. */}
              <div className="mt-10 flex flex-col items-center text-center">
                <span className="inline-flex size-11 items-center justify-center rounded-md bg-pro-gold text-pro">
                  <Glyph name={proLead.icon} className="size-[22px]" />
                </span>
                <h2 className="mt-4 text-xl text-pro-ink">{proLead.title}</h2>
                {proLead.soon ? (
                  <span className="mt-3 inline-flex items-center whitespace-nowrap rounded-full border border-pro-gold px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-pro-gold">
                    Coming soon
                  </span>
                ) : null}
                <p className="mt-3 max-w-[52ch] text-md text-pro-ink-soft">
                  {proLead.body}
                </p>
              </div>

              {/* Built first, and only built. What is not shipped yet is folded
                away behind the chevron: the block still tells the whole story
                of the tier, but what you can use today is what you see. */}
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                {proPerks
                  .filter((p) => !p.soon)
                  .map((p) => (
                    <div
                      key={p.title}
                      className="w-full sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)]"
                    >
                      <PerkCard perk={p} />
                    </div>
                  ))}
              </div>

              {/* <details>, not state — the fold works before hydration, and the
                open/closed arrow is one CSS variant off the parent. */}
              <details className="group mt-6">
                <summary className="mx-auto flex w-fit cursor-pointer list-none items-center gap-2 rounded-full border border-pro-edge px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-pro-gold transition-colors hover:bg-pro-2 [&::-webkit-details-marker]:hidden">
                  <span className="group-open:hidden">More, coming soon</span>
                  <span className="hidden group-open:inline">Show less</span>
                  <FlockChevron
                    size={11}
                    className="shrink-0 transition-transform group-open:-rotate-180"
                  />
                </summary>

                {/* Flex for the same reason as the free fold above: a part-full
                  last row sits centred, not left-hung. */}
                <div className="mt-6 flex flex-wrap justify-center gap-4">
                  {proPerks
                    .filter((p) => p.soon)
                    .map((p) => (
                      <div
                        key={p.title}
                        className="w-full sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)]"
                      >
                        <PerkCard perk={p} />
                      </div>
                    ))}
                </div>
              </details>

              {/* At the foot rather than the corner: it reads after the perks
                have made the case, and it is the widest thing in the block so
                it is unmissable. Lands on the billing panel, where the plan,
                the two prices and the portal live — signing in first if need be. */}
              <div className="mt-10 flex flex-col items-center gap-3">
                <div className="w-full max-w-[30rem]">
                  {/* One press per interval, straight to Stripe — the only page
                    between wanting Pro and paying for it is Stripe's own. */}
                  {alreadyPro ? (
                    /* Already paying — the block stops selling and reports. */
                    <div className="flex flex-col items-center gap-2">
                      <p className="font-display text-md font-semibold tracking-tight text-pro-ink">
                        You&rsquo;re on Pro. All of this is yours.
                      </p>
                      <p className="text-sm text-pro-ink-soft">
                        {proRow ? renewalLabel(proRow) : null}
                      </p>
                      <Link
                        href="/settings?section=billing"
                        className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-pro-gold underline-offset-4 hover:underline"
                      >
                        Your plan and billing
                      </Link>
                    </div>
                  ) : (
                    <ProUpgrade
                      prices={prices}
                      canBuy={canBuy}
                      href={billing}
                    />
                  )}
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-pro-ink-soft">
                  Cancel any time
                </p>
              </div>
            </div>
          </section>
  );
}

/**
 * One perk in the Pro grid. The "coming soon" badge is a gold outline rather
 * than a filled chip so it reads as a caveat on the perk and never competes
 * with the buy buttons at the foot of the block.
 */
function PerkCard({ perk }: { perk: Perk }) {
  return (
    <article className="h-full rounded-md border border-pro-edge bg-pro-2 p-4">
      <div className="flex items-start gap-2.5">
        <span className="shrink-0 text-pro-gold">
          <Glyph name={perk.icon} className="mt-px size-[18px]" />
        </span>
        <h3 className="text-sm text-pro-ink">{perk.title}</h3>
        {perk.soon ? (
          <span className="ml-auto mt-px inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-pro-gold px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-pro-gold">
            Soon
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-pro-ink-soft">{perk.body}</p>
    </article>
  );
}
