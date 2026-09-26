/**
 * `/` — marketing landing (ticket 05, 19; reskinned 192; front door, ADR-019). Public, static —
 * illustrative sample UI, not a database read. White ground + domain pastels
 * (ticket 187): each stop wears the pastel its trip tab owns, so the marketing
 * page and the product teach one colour language.
 */
import { getSession } from "@/server/access";
import { proPrices } from "@/server/billing/billing";
import type { ProPrice } from "@/server/billing/billing";
import { allFeaturesFree } from "@/lib/env";
import { formatMoney } from "@floc/core/money/money";
import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import { ButtonLink } from "@/components/system/ui";
import { ConfettiWord } from "@/components/system/confetti-word";
import { BorrowTrip } from "@/components/landing/borrow-trip";
import { AppBand } from "@/components/landing/app-band";
import { ClosingTicket } from "@/components/landing/closing-ticket";
import { HeroDeck } from "@/components/landing/hero-deck";
import { LandingFaq } from "@/components/landing/landing-faq";
import { FeatureFilm } from "@/components/landing/tour/feature-film";
import { shotFor } from "@/components/landing/tour/tour-shots";
import { tourSlides } from "@/components/landing/tour/tour-slides";
import { borrowCards } from "@/lib/landing/borrow";
import { landingFaq } from "@/lib/landing/faq";

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
  // Pro is sold in the FAQ, after the proof (ADR-019). With Pro switched off
  // the question is not asked, so Stripe's prices are not worth fetching.
  const sellingPro = !allFeaturesFree();
  const prices = sellingPro ? await proPrices() : [];
  const { start, inspire } = destinations(signedIn);

  return (
    <div className="pt-6 sm:pt-10">
      {/* ── hero ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[60rem] px-4 pt-12 text-center sm:px-6 sm:pt-16">
        <h1 className="font-display text-[clamp(2.8rem,7.4vw,6rem)] font-semibold leading-none tracking-[-0.04em]">
          Group trip planning,{" "}
          <ConfettiWord>
            <span className="hl hl-loose hl-green">sorted</span>
          </ConfettiWord>
          .
        </h1>
        <p className="mx-auto mt-6 max-w-[44ch] text-md text-ink-soft">
          One page your whole group can edit: where you&rsquo;re going, the
          days everyone can make, the route, and who owes who.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href={start} variant="primary" className="px-6 py-3 text-[12px]">
            {signedIn ? "Get planning!" : "Start a trip — free"}
          </ButtonLink>
          <ButtonLink href={inspire} variant="secondary" className="px-6 py-3 text-[12px]">
            See example trips
          </ButtonLink>
        </div>
      </section>

      {/* Illustrative sample, not a live query — one Sicily trip settling. */}
      <div className="mt-16">
        <HeroDeck />
      </div>

      <div className="mx-auto w-full max-w-[84rem] px-4 sm:px-6">
        {/* ── feature summary ────────────────────────────────────────── */}
        <section className="mt-24">
          <FeatureFilm slides={tourSlides(sellingPro).map((s) => ({ ...s, shot: shotFor(s.key) }))} />
        </section>

        {/* ── explore ────────────────────────────────────────────────── */}
        <section className="mt-24">
          <BorrowTrip cards={borrowCards(PRESET_TRIPS, BORROW_IDS)} signedIn={signedIn} explore={inspire} />
        </section>

        {/* ── questions ──────────────────────────────────────────────── */}
        <section className="my-24">
          <LandingFaq items={landingFaq({ sellingPro, monthly: monthlyPrice(prices) })} />
        </section>
      </div>

      <AppBand />
      <ClosingTicket signedIn={signedIn} />
    </div>
  );
}
