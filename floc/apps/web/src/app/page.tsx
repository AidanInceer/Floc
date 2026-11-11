/**
 * `/` — marketing landing (ticket 05, 19; reskinned 192; front door, ADR-019). Public, static —
 * illustrative sample UI, not a database read. White ground + domain pastels
 * (ticket 187): each stop wears the pastel its trip tab owns, so the marketing
 * page and the product teach one colour language.
 */
import { headers } from "next/headers";
import type { Metadata } from "next";
import { getSession } from "@/server/access";
import { proPrices } from "@/server/billing/billing";
import type { ProPrice } from "@/server/billing/billing";
import { allFeaturesFree } from "@/lib/env";
import { publicMetadata } from "@/lib/seo/public-pages";
import { formatMoney } from "@floc/core/money/money";
import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import { ButtonLink, cx } from "@/components/system/ui";
import { BorrowTrip } from "@/components/landing/borrow-trip";
import { AppBand } from "@/components/landing/app-band";
import { ClosingTicket } from "@/components/landing/closing-ticket";
import { HeroDeck } from "@/components/landing/hero/hero-deck";
import { TypedWord } from "@/components/landing/hero/typed-word";
import { Shore } from "@/components/landing/shore";
import { LandingFaq } from "@/components/landing/landing-faq";
import { ProBand } from "@/components/landing/pro-band/pro-band";
import { FeatureTour } from "@/components/landing/tour/feature-tour";
import { shotFor } from "@/components/landing/tour/tour-shots";
import { tourSlides } from "@/components/landing/tour/tour-slides";
import { borrowCards, leadFirst } from "@/lib/landing/borrow";
import { listingRates, viewerCurrency } from "@/server/money/viewer-currency";
import { landingFaq } from "@/lib/landing/faq";
import "@/components/landing/landing.css";

const LANDING = publicMetadata({
  path: "/",
  title: "Floc — Trip planning, sorted.",
  description: "Floc keeps a group trip in one place: the notes, the route, the days, and who owes who.",
});

export const metadata: Metadata = {
  ...LANDING,
  title: { absolute: "Floc — Trip planning, sorted." },
  openGraph: {
    ...LANDING.openGraph,
    images: [{
      url: "/floc-hero.png",
      width: 1246,
      height: 848,
      alt: "Trip planning, sorted. Floc's Sicily example trip, with destination votes, dates, shared costs and packing.",
    }],
  },
};

// The Explore listings the Borrow band opens on, in this order; every other listing waits behind them.
const BORROW_IDS = [
  "japan-golden-route",
  "hanoi-to-bangkok",
  "iceland-ring-road",
  "morocco-atlas-sahara",
  "cape-to-victoria-falls",
  "new-zealand-south-island",
];

/**
 * Where every call to action on the page lands. Signed out, starting a trip
 * detours through sign-up and comes back. Explore is public, so "see example
 * trips" goes straight there.
 */
function destinations(signedIn: boolean) {
  return signedIn ? { start: "/trips", inspire: "/explore" } : { start: "/signup", inspire: "/explore" };
}

/** Stripe owns the figure, so an unreachable price sells Pro without quoting one rather than breaking. */
function monthlyPrice(prices: ProPrice[]): string | null {
  const monthly = prices.find((p) => p.interval === "monthly");
  return monthly ? formatMoney(monthly.amountMinor, monthly.currency) : null;
}

export default async function LandingPage() {
  const session = await getSession();
  const signedIn = Boolean(session?.user);
  const rates = await listingRates(await viewerCurrency(session?.user?.id ?? null, await headers()));
  // Pro is sold after the proof (ADR-019), in its own band and the FAQ. With Pro
  // switched off neither shows, so Stripe's prices are not worth fetching.
  const sellingPro = !allFeaturesFree();
  const prices = sellingPro ? await proPrices() : [];
  const monthly = monthlyPrice(prices);
  const { start, inspire } = destinations(signedIn);

  return (
    <div>
      {/* Up behind the top bar's beads (-mt-15 is the bar's height), so the bar has no band of its own. */}
      <div className="-mt-15 bg-sheet pb-4 pt-21 sm:pt-25">
        {/* ── hero ─────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-[60rem] px-4 text-center sm:px-6 sm:pt-16">
          <h1 className="font-display text-[clamp(2.3rem,7.4vw,6rem)] font-semibold leading-none tracking-[-0.04em]">
            <span className="sr-only">Trip planning, sorted.</span>
            <span aria-hidden="true">Trip planning,</span>
            <TypedWord />
          </h1>
          <p className="mx-auto mt-3 max-w-[44ch] text-[15px] text-ink-soft sm:mt-6 sm:text-md">
            Keep the destination, dates, route and costs in one place. Plan on your own,
            or with everyone who&rsquo;s coming.
          </p>
          <div className="mt-4 flex justify-center gap-2 sm:mt-8 sm:flex-wrap sm:gap-3">
            <ButtonLink href={start} variant="primary" className="whitespace-nowrap px-3 py-2.5 text-[12px] sm:px-6 sm:py-3">
              {signedIn ? "Get planning!" : "Start a trip — free"}
            </ButtonLink>
            <ButtonLink href={inspire} variant="secondary" className="whitespace-nowrap px-3 py-2.5 text-[12px] sm:px-6 sm:py-3">
              See example trips
            </ButtonLink>
          </div>
        </section>

        {/* Illustrative sample, not a live query — one Sicily trip settling. */}
        <div className="mt-2 sm:mt-16">
          <HeroDeck />
        </div>
      </div>
      <Shore className="-mt-px fill-sheet" />

      <div className="mx-auto w-full max-w-[84rem] px-4 sm:px-6">
        {/* ── feature summary ────────────────────────────────────────── */}
        <section className="mt-16">
          <FeatureTour slides={tourSlides(sellingPro).map((s) => ({ ...s, shot: shotFor(s.key) }))} />
        </section>

        {/* ── explore ────────────────────────────────────────────────── */}
        <section className="mt-24">
          <BorrowTrip cards={borrowCards(PRESET_TRIPS, leadFirst(PRESET_TRIPS, BORROW_IDS), rates)} signedIn={signedIn} explore={inspire} />
        </section>

      </div>

      {/* ── pro ────────────────────────────────────────────────────────── */}
      {sellingPro && <ProBand prices={prices} signedIn={signedIn} />}

      {/* Why: the Pro slab's lower slant is painted in this white, so with Pro off the FAQ brings its own gap and hairline. */}
      <section className={cx("bg-sheet", !sellingPro && "mt-24 border-t border-rule")}>
        <LandingFaq items={landingFaq({ sellingPro, monthly })} />
      </section>
      <AppBand />
      <ClosingTicket signedIn={signedIn} />
    </div>
  );
}
