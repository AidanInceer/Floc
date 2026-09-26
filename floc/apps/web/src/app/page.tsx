/**
 * `/` — marketing landing (ticket 05, 19; reskinned 192). Public, static —
 * illustrative sample UI, not a database read. White ground + domain pastels
 * (ticket 187): each stop wears the pastel its trip tab owns, so the marketing
 * page and the product teach one colour language.
 */
import type { ReactNode } from "react";
import { getSession } from "@/server/access";
import { proPrices, subscriptionOf } from "@/server/billing/billing";
import type { ProPrice } from "@/server/billing/billing";
import { allFeaturesFree } from "@/lib/env";
import { formatMoney } from "@floc/core/money/money";
import { isLive } from "@floc/core/billing/subscription-copy";
import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import { ButtonLink } from "@/components/system/ui";
import { RouteMap } from "@/components/map/route-map";
import { ConfettiWord } from "@/components/system/confetti-word";
import { BorrowTrip } from "@/components/landing/borrow-trip";
import { HeroPack } from "@/components/landing/hero-pack";
import { Glyph } from "@/components/landing/landing-glyph";
import { sampleStops } from "@/components/landing/sample-trip";
import { FeatureFilm } from "@/components/landing/tour/feature-film";
import { shotFor } from "@/components/landing/tour/tour-shots";
import { tourSlides } from "@/components/landing/tour/tour-slides";
import { borrowCards } from "@/lib/landing/borrow";

// The Explore listings the landing page rolls through, in this order.
const BORROW_IDS = [
  "japan-golden-route",
  "andalusia-road-trip",
  "iceland-ring-road",
  "morocco-atlas-sahara",
  "vietnam-north-to-south",
  "new-zealand-south-island",
];

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
      <section className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
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
        <HeroPack />
      </section>

      {/* ── feature summary ──────────────────────────────────────────── */}
      <section className="mt-24">
        <FeatureFilm slides={tourSlides(sellingPro).map((s) => ({ ...s, shot: shotFor(s.key) }))} />
      </section>

      {/* ── the sample map ───────────────────────────────────────────── */}
      <section className="mt-24">
        <SectionHead title="See the route" />

        <div className="mt-8">
          <RouteMap stops={sampleStops} missing={[]} />
        </div>
      </section>

      {/* ── explore CTA ──────────────────────────────────────────────── */}
      <section className="mt-24">
        <BorrowTrip cards={borrowCards(PRESET_TRIPS, BORROW_IDS)} signedIn={Boolean(session?.user)} explore={inspire} />
      </section>

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
