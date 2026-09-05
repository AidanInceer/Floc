/**
 * `/` — marketing landing (ticket 05, 19; reskinned 192). Public, static —
 * illustrative sample UI, not a database read. White ground + domain pastels
 * (ticket 187): each stop wears the pastel its trip tab owns, so the marketing
 * page and the product teach one colour language.
 */
import type { ReactNode } from "react";
import { getSession } from "@/server/access";
import { proPrices, subscriptionOf } from "@/server/billing";
import type { ProPrice } from "@/server/billing";
import { allFeaturesFree } from "@/lib/env";
import { formatMoney } from "@floc/core/money";
import { isLive } from "@floc/core/subscription-copy";
import { ButtonLink, PASTEL_SKINS, cx } from "@/components/ui";
import { RouteMap } from "@/components/route-map";
import { ProBlock } from "./landing-pro";
import { ConfettiWord } from "@/components/confetti-word";
import { FlockChevron } from "@/components/flock-chevron";
import { Glyph, features, sampleStops } from "./landing-content";
import type { Feature } from "./landing-content";

/**
 * Where every call to action on the page lands. Signed out, most of the
 * product sits behind the account, so those detour through the door they need
 * and come back — one place to change that, not four. Explore is the
 * exception: it is public, so "get inspired" goes straight there.
 */
function destinations(signedIn: boolean) {
  return signedIn
    ? {
        start: "/trips",
        inspire: "/explore",
        billing: "/settings?section=billing",
      }
    : {
        start: "/signup",
        inspire: "/explore",
        billing: "/login?redirect=%2Fsettings%3Fsection%3Dbilling",
      };
}

/**
 * The hero's second button (ticket 278). The monthly price rides on the label
 * so the objection is answered above the fold; Stripe owning the figure means
 * an unreachable price sells Pro without quoting one rather than breaking.
 */
function proCtaLabel(prices: ProPrice[]): string {
  const monthly = prices.find((p) => p.interval === "monthly");
  return monthly
    ? `Or go Pro — ${formatMoney(monthly.amountMinor, monthly.currency)}/mo`
    : "Or go Pro";
}

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

  const { start, inspire, billing } = destinations(Boolean(session?.user));
  const proCta = sellingPro && !alreadyPro ? proCtaLabel(prices) : null;

  return (
    <div className="mx-auto w-full max-w-[84rem] px-4 pt-6 sm:px-6 sm:pt-10">
      {/* ── hero ─────────────────────────────────────────────────────── */}
      <section className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.82fr)] lg:gap-16">
        <div>
          <h1 className="font-display text-[clamp(2.4rem,5.4vw,4rem)] font-semibold leading-[1.04] tracking-[-0.03em]">
            Group trip planning,{" "}
            <ConfettiWord>
              <span className="hl hl-loose hl-green">sorted</span>
            </ConfettiWord>
            .
          </h1>
          <p className="mt-5 max-w-[46ch] text-md text-ink-soft">
            One page your whole group can edit: where you&rsquo;re going, the
            days everyone can make, the route, and who owes who.
          </p>
          {/* One call to action above the fold (ticket 192); the secondary
              "get inspired" route waits until the invite band below. Signed
              out the whole product is behind the account, so the button says
              so — the price is the objection, so it goes on the button. */}
          <HeroCta
            start={start}
            signedIn={Boolean(session?.user)}
            proCta={proCta}
            billing={billing}
          />
        </div>

        {/* Illustrative sample, not a live query — one settled trip, so the
            hero shows the thing the page is selling rather than a mood board. */}
        <aside className="lift rounded-lg bg-peri p-6 text-peri-ink sm:p-7">
          <p className="typed text-current">One trip, one page</p>
          <div className="mt-3 flex items-baseline justify-between gap-4">
            <h2 className="text-xl">Sicily</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-pen px-3 py-1 font-display text-xs font-semibold text-sheet">
              <Glyph name="check" className="size-[11px]" />
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
            <StubRow k="Who">
              <span className="nums text-sm">6 in, all paid up</span>
            </StubRow>
          </div>

          <p className="mt-5 text-sm opacity-80">
            Everything the group has agreed, in one place.
          </p>
        </aside>
      </section>

      {/* ── feature summary ──────────────────────────────────────────── */}
      <section className="mt-24">
        <SectionHead title="Everything in one place" />
        {/* Same contract as the Pro block below: what you see is what you can
          use today, and what is only planned folds away behind the chevron. */}
        {/* The three that ARE the product head the grid in their domain
          pastels; the table stakes follow in plain sheet. */}
        <div className="mt-10 flex flex-wrap justify-center gap-5">
          {features
            .filter((f) => f.lead)
            .map((f) => (
              <div
                key={f.title}
                className="w-full md:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]"
              >
                <FeatureCard feature={f} />
              </div>
            ))}
        </div>
        {/* Below the leads no pastel carries meaning — notes and tickets own
          no domain — so these take the decorative rotation by position. */}
        <div className="mt-5 flex flex-wrap justify-center gap-5">
          {features
            .filter((f) => !f.soon && !f.lead)
            .map((f, i) => (
              <div
                key={f.title}
                className="w-full md:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]"
              >
                <FeatureCard
                  feature={f}
                  tone={PASTEL_SKINS[i % PASTEL_SKINS.length]}
                />
              </div>
            ))}
        </div>

        {/* <details>, not state — the fold works before hydration. */}
        <details className="group mt-6">
          <summary className="mx-auto flex w-fit cursor-pointer list-none items-center gap-2 rounded-full border border-rule px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft transition-colors hover:bg-sheet-2 [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">More, coming soon</span>
            <span className="hidden group-open:inline">Show less</span>
            <FlockChevron
              size={11}
              className="shrink-0 transition-transform group-open:-rotate-180"
            />
          </summary>

          {/* Flex, not grid: a part-full last row centres under the grid above
            rather than hanging off its left edge. The widths reproduce the
            same tracks, gap included. */}
          <div className="mt-6 flex flex-wrap justify-center gap-5">
            {features
              .filter((f) => f.soon)
              .map((f) => (
                <div
                  key={f.title}
                  className="w-full md:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]"
                >
                  <FeatureCard feature={f} />
                </div>
              ))}
          </div>
        </details>
      </section>

      {/* ── the sample map ───────────────────────────────────────────── */}
      <section className="mt-24">
        <SectionHead title="See the route" />

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

      <ProBlock
        show={sellingPro}
        alreadyPro={alreadyPro}
        proRow={proRow}
        prices={prices}
        canBuy={Boolean(session?.user)}
        billing={billing}
      />

      {/* ── invite band (closing) ────────────────────────────────────── */}
      <section className="mt-24 grid items-center gap-12 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-16">
        {/* The closing band's left card advertises the app instead of the
            invite link (ticket 277): the buttons beside it start a trip, so a
            card addressed to someone arriving on an invite pointed the wrong
            way. Same box, same size — different pitch. */}
        <div className="rounded-lg bg-pen-soft px-8 py-10 text-center text-pen-deep">
          <span className="mx-auto mb-3.5 inline-flex size-10 items-center justify-center rounded-md bg-sheet/60">
            <Glyph name="app" className="size-5" />
          </span>
          <p className="font-display text-xl font-semibold tracking-tight">
            The plan in your pocket
          </p>
          <p className="mt-3.5 font-mono text-[10px] uppercase tracking-[0.22em] opacity-70">
            iOS and Android — coming soon
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
 * The hero pair. Signed out the whole product sits behind the account, so the
 * primary button says the price on it and a quiet sign-in sits beside it.
 */
function HeroCta({
  start,
  signedIn,
  proCta,
  billing,
}: {
  start: string;
  signedIn: boolean;
  proCta: string | null;
  billing: string;
}) {
  return (
    <div className="mt-8">
      {/* One free action only — signing in lives in the header, so a second
        pill here just competed with it. */}
      <ButtonLink href={start} variant="primary">
        {signedIn ? "Get planning!" : "Sign up free — get planning"}
      </ButtonLink>
      {/* Its own line, not a third pill in the row: free stays the obvious
        action and Pro is still unmissable. */}
      {proCta ? (
        <div className="mt-3">
          <ButtonLink href={billing} variant="pro">
            <Glyph name="star" className="size-[13px]" />
            {proCta}
          </ButtonLink>
        </div>
      ) : null}
    </div>
  );
}

/**
 * One tile in the free feature grid. The "soon" badge is a plain rule outline
 * — the Pro grid's gold is what marks a perk as paid, so it stays over there.
 */
function FeatureCard({
  feature,
  tone,
}: {
  feature: Feature;
  tone?: string;
}) {
  return (
    <article className="lift h-full rounded-lg border border-rule bg-sheet p-6">
      <div className="flex items-start gap-3">
        <span
          className={cx(
            "inline-flex size-9 shrink-0 items-center justify-center rounded-md",
            feature.tone ?? tone ?? "bg-sheet-2 text-ink",
          )}
        >
          <Glyph name={feature.icon} className="size-[18px]" />
        </span>
        <h3
          className={cx(
            "self-center text-md",
            feature.lead && "font-semibold tracking-tight",
          )}
        >
          {feature.title}
        </h3>
        {/* items-start + a nudge, not items-center: a title that wraps to two
          lines would otherwise drag the badge down with it. */}
        {feature.soon ? (
          <span className="ml-auto mt-[9px] inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-rule px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-soft">
            Soon
          </span>
        ) : null}
      </div>
      <p className="mt-4 text-sm text-ink-soft">{feature.body}</p>
    </article>
  );
}
