/**
 * `/` — marketing landing (ticket 05, 19; reskinned 192). Public, static —
 * illustrative sample UI, not a database read. White ground + domain pastels
 * (ticket 187): each stop wears the pastel its trip tab owns, so the marketing
 * page and the product teach one colour language.
 */
import type { ReactNode } from "react";
import Link from "next/link";

import { getSession } from "@/server/access";
import { proPrices, subscriptionOf } from "@/server/billing";
import { allFeaturesFree } from "@/lib/env";
import { isLive, renewalLabel } from "@/lib/subscription-copy";
import { ProUpgrade } from "@/components/billing-buttons";
import { ButtonLink, cx } from "@/components/ui";
import { RouteMap } from "@/components/route-map";
import {
  Glyph,
  Stars,
  reviews,
  features,
  sampleStops,
  proLead,
  proPerks,
} from "./landing-content";
import type { Perk } from "./landing-content";

function SectionHead({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  // One heading per section (CLAUDE.md #209) — a single title, no small label
  // stacked above it. The optional line below is body copy, not a second head.
  return (
    <div className="max-w-[54ch]">
      <h2 className="text-[clamp(1.7rem,3.5vw,2.5rem)]">{title}</h2>
      {children ? (
        <p className="mt-4 text-md text-ink-soft">{children}</p>
      ) : null}
    </div>
  );
}

function StubRow({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-sheet/60 px-4 py-3">
      <span className="text-sm opacity-80">{k}</span>
      {children}
    </div>
  );
}

export default async function LandingPage() {
  const session = await getSession();
  // One start destination, reused by every call to action on the page. Signed
  // out heads to /signup; signed in, straight to your trips.
  // The Pro button goes straight to Stripe for someone signed in and not
  // already paying; anyone else needs a page first, so it stays a link.
  // With Pro switched off the block is not drawn, so neither the local row
  // nor Stripe's prices are worth asking for.
  const sellingPro = !allFeaturesFree();
  const [proRow, prices] = await Promise.all([
    sellingPro && session?.user ? subscriptionOf(session.user.id) : null,
    sellingPro ? proPrices() : [],
  ]);
  const alreadyPro = proRow !== null && isLive(proRow);

  const start = session?.user ? "/trips" : "/signup";
  const inspire = session?.user ? "/explore" : "/login?redirect=%2Fexplore";

  return (
    <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6 sm:pt-10">
      {/* ── hero ─────────────────────────────────────────────────────── */}
      <section className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.82fr)] lg:gap-16">
        <div>
          <h1 className="font-display text-[clamp(2.4rem,5.4vw,4rem)] font-semibold leading-[1.04] tracking-[-0.03em]">
            <span className="hl hl-loose hl-red">Group</span> trip planning,{" "}
            <span className="hl hl-loose hl-green">sorted</span>.
          </h1>
          <p className="mt-6 max-w-[36ch] text-md text-ink-soft">
            Less faff, fewer group chats. Everything for the trip in one place,
            kept in sync.
          </p>

          {/* One call to action above the fold (ticket 192); the secondary
              "get inspired" route waits until the invite band below. */}
          <div className="mt-8">
            <ButtonLink href={start} variant="primary">
              Get planning!
            </ButtonLink>
          </div>
        </div>

        {/* Illustrative sample, not a live query — one settled trip, so the
            hero shows the thing the page is selling rather than a mood board. */}
        <aside className="lift rounded-lg bg-peri p-6 text-peri-ink sm:p-7">
          <p className="typed text-current">One trip, one page</p>
          <div className="mt-3 flex items-baseline justify-between gap-4">
            <h2 className="text-xl">Sicily</h2>
            <span className="inline-flex items-center rounded-full bg-mint px-3 py-1 font-display text-xs font-semibold text-mint-ink">
              Agreed
            </span>
          </div>
          <p className="font-mono text-xs opacity-70">late Sept</p>

          <div className="mt-5 flex flex-col gap-2.5">
            <StubRow k="Dates">
              <span className="nums text-sm">12–19 Sep</span>
            </StubRow>
            <StubRow k="Route">
              <span className="nums text-sm">3 stops · 7 nights</span>
            </StubRow>
            <StubRow k="Money">
              <span className="nums text-sm">£177 each</span>
            </StubRow>
            <StubRow k="Days">
              <span className="inline-flex items-center rounded-full bg-sheet/70 px-3 py-0.5 text-xs font-semibold">
                2 still blank
              </span>
            </StubRow>
          </div>

          <p className="mt-5 text-sm opacity-80">
            Everything the group has agreed, in one place.
          </p>
        </aside>
      </section>

      {/* ── what people say (artificial) ─────────────────────────────── */}
      <section className="mt-24">
        <SectionHead title="What people say" />

        {/* Pulled out to the page gutter on purpose — the cards should run off
            the edge rather than stop dead at the column. */}
        <div className="marquee -mx-4 mt-10 sm:-mx-6">
          <div className="marquee-track py-2">
            {[0, 1].map((pass) =>
              reviews.map((r) => (
                <figure
                  key={`${pass}-${r.name}`}
                  aria-hidden={pass === 1}
                  className={cx(
                    "lift mr-5 w-[19rem] shrink-0 rounded-lg p-6",
                    r.skin,
                  )}
                >
                  <Stars rating={r.rating} />
                  <blockquote className="mt-4 text-sm opacity-90">
                    “{r.body}”
                  </blockquote>
                  <figcaption className="mt-5">
                    <p className="font-display text-md font-semibold tracking-tight">
                      {r.name}
                    </p>
                    <p className="mt-0.5 font-mono text-xs opacity-70">
                      {r.role}
                    </p>
                  </figcaption>
                </figure>
              )),
            )}
          </div>
        </div>
      </section>

      {/* ── feature summary ──────────────────────────────────────────── */}
      <section className="mt-24">
        <SectionHead title="Everything in one place" />
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <article
              key={f.title}
              className="lift rounded-lg border border-rule bg-sheet p-6"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-sheet-2 text-ink">
                  <Glyph name={f.icon} className="size-[18px]" />
                </span>
                <h3 className="text-md">{f.title}</h3>
              </div>
              <p className="mt-4 text-sm text-ink-soft">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── the sample map ───────────────────────────────────────────── */}
      <section className="mt-24">
        <SectionHead title="See the route">
          The same map that sits at the top of a trip. Numbered pins match the
          order; the yellow badge is how many nights you spend there.
        </SectionHead>

        <div className="mt-8">
          <RouteMap stops={sampleStops} missing={[]} />
        </div>
      </section>

      {/* ── explore CTA ──────────────────────────────────────────────── */}
      <section className="mt-24 grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
        <div>
          <h2 className="text-[clamp(1.5rem,3vw,2.1rem)]">
            Borrow a trip someone has already worked out.
          </h2>
          <p className="mt-4 text-ink-soft">
            Explore is a shelf of finished routes — real stops, real nights,
            real costs. Find one you like and start your own from it.
          </p>
          <div className="mt-6">
            <ButtonLink href={inspire} variant="primary">
              Explore trips
            </ButtonLink>
          </div>
        </div>
        <div className="lift rounded-lg bg-blush p-6 text-blush-ink">
          <p className="typed text-current">On the shelf</p>
          <div className="mt-4 flex flex-col gap-2.5">
            {[
              { k: "Sicily", v: "7 nights · 4 stops" },
              { k: "Porto", v: "4 nights · 2 stops" },
              { k: "Andalucía", v: "9 nights · 5 stops" },
            ].map((t) => (
              <div
                key={t.k}
                className="flex items-baseline justify-between gap-4 rounded-md bg-sheet/60 px-4 py-3 text-sm"
              >
                <span className="font-display font-semibold tracking-tight">
                  {t.k}
                </span>
                <span className="nums text-xs opacity-75">{t.v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── get the app (doesn't exist yet) ──────────────────────────── */}
      <section className="mt-24">
        <div className="flex flex-col items-center gap-6 rounded-lg border border-rule bg-sheet px-8 py-12 text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-lg bg-sheet-2 text-ink">
            <Glyph name="app" className="size-6" />
          </span>
          <div className="max-w-[46ch]">
            <h2 className="text-[clamp(1.5rem,3vw,2.1rem)]">
              The app is coming — the plan in your pocket.
            </h2>
            <p className="mt-4 text-ink-soft">
              Everything the group has agreed, offline and on your phone. iOS
              and Android both. Plan on the web today; take it with you soon.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {["iOS", "Android"].map((os) => (
              <span
                key={os}
                className="inline-flex items-center rounded-full bg-sheet-2 px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] text-ink-soft"
              >
                {os} — coming soon
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pro tier (blueprint) ─────────────────────────────────────── */}
      {/* Nothing to sell while every feature is free — the whole block goes,
          rather than a version of it that quotes no price. */}
      {/* The one paid thing on the page, so it is the one block that refuses
          the pale palette: parchment and gold in light, black and gold in
          dark. Pro is real as of ticket 247, so the button now sells. */}
      {sellingPro ? (
        <section className="mt-24">
          <div className="overflow-hidden rounded-lg bg-pro p-8 text-pro-ink sm:p-12">
            {/* The block runs down one centre line: name, then the reason the
              tier exists, then the perks, then the button. */}
            <div className="flex justify-center">
              <span className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-pro-gold px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-pro-gold">
                <Glyph name="star" />
                Waypoint Pro
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
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {proPerks
                .filter((p) => !p.soon)
                .map((p) => (
                  <PerkCard key={p.title} perk={p} />
                ))}
            </div>

            {/* <details>, not state — the fold works before hydration, and the
              open/closed arrow is one CSS variant off the parent. */}
            <details className="group mt-6">
              <summary className="mx-auto flex w-fit cursor-pointer list-none items-center gap-2 rounded-full border border-pro-edge px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-pro-gold transition-colors hover:bg-pro-2 [&::-webkit-details-marker]:hidden">
                <span className="group-open:hidden">More, coming soon</span>
                <span className="hidden group-open:inline">Show less</span>
                <svg
                  width={12}
                  height={12}
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 transition-transform group-open:-rotate-180"
                  aria-hidden
                >
                  <path d="M3 5.5l4 4 4-4" />
                </svg>
              </summary>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {proPerks
                  .filter((p) => p.soon)
                  .map((p) => (
                    <PerkCard key={p.title} perk={p} />
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
                      {renewalLabel(proRow)}
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
                    canBuy={Boolean(session?.user)}
                    href="/login?redirect=%2Fsettings%3Fsection%3Dbilling"
                  />
                )}
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-pro-ink-soft">
                Cancel any time
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {/* ── invite band (closing) ────────────────────────────────────── */}
      <section className="mt-24 grid items-center gap-12 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-16">
        <div className="rounded-lg bg-pen-soft px-8 py-10 text-center text-pen-deep">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-70">
            Waypoint · admitted
          </p>
          <p className="my-3.5 font-display text-xl font-semibold tracking-tight">
            Got a link from a friend?
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-70">
            No account needed to look
          </p>
        </div>

        <div>
          <h2 className="text-[clamp(1.5rem,3vw,2.1rem)]">
            Open the link and you&rsquo;ll see the trip first.
          </h2>
          <p className="mt-4 text-ink-soft">
            A preview of where the group has got to — the dates, the route,
            what&rsquo;s still open — before you make an account. Start your own
            the same way.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <ButtonLink href={start} variant="primary">
              Start your own trip
            </ButtonLink>
            <ButtonLink href={inspire} variant="ghost">
              Get inspired
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * One perk in the Pro grid. The "coming soon" badge is a gold outline rather
 * than a filled chip so it reads as a caveat on the perk and never competes
 * with the buy buttons at the foot of the block.
 */
function PerkCard({ perk }: { perk: Perk }) {
  return (
    <article className="rounded-md border border-pro-edge bg-pro-2 p-4">
      <div className="flex items-center gap-2.5">
        <span className="shrink-0 text-pro-gold">
          <Glyph name={perk.icon} className="size-[18px]" />
        </span>
        <h3 className="text-sm text-pro-ink">{perk.title}</h3>
        {perk.soon ? (
          <span className="ml-auto inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-pro-gold px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-pro-gold">
            Soon
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-pro-ink-soft">{perk.body}</p>
    </article>
  );
}
