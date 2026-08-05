/**
 * `/` — marketing landing (ticket 05, 19). Public.
 *
 * Ticket 19's data-source question: neither real trips nor seeded database
 * rows — a static, hand-written sample of the product's own UI, built from
 * the real design tokens. Needs no database read, so this page stays a
 * plain server component with zero queries.
 *
 * The page follows `docs/mockups/homepage-g-boardingpass.html` end to end —
 * "the travel document". It replaces the before/after hero
 * (`homepage-hero-b-beforeafter.html`) and the wandering dashed route
 * (`homepage-pinboard.html`), which were two visual languages stacked on one
 * page: a hero made of post-its, then marketing sections made of paper.
 *
 * The one idea, carried the whole way down: the trip as a wallet of printed
 * objects you're holding.
 *
 *   1. THE PASS          — the hero. Headline on the body, CTAs where the gate
 *                          block goes, the trip's state on a real tear-off stub.
 *   2. THE LUGGAGE TAGS  — who it's for, as three tags on strings.
 *   3. THE COUPON BOOK   — the six stops as one perforated fold-out strip, each
 *                          coupon with a counterfoil carrying the stop number
 *                          and the tab's name.
 *   4. THE ENTRY STAMP   — the closing CTA as the customs page.
 *
 * The MRZ strip at the foot is the one flourish that isn't load-bearing: the
 * machine-readable line off the bottom of a passport, spelling out the sample
 * trip. Decoration, `aria-hidden`, and the page's closing rule at once.
 *
 * Every surface is a token — see the landing block in globals.css for why the
 * punched holes are `--sheet` and not `--paper`.
 *
 * TICKET 123 — what the page deliberately no longer has. Three treatments were
 * stacked on one document and the page read as three designs:
 *
 *   - The typewriter eyebrow above the pass ("Start the trip as notes. Finish
 *     it as a plan"). The `h1` under it says the same thing louder, so it was
 *     a strapline introducing a strapline.
 *   - The handwritten marginalia — "— started 14 Feb, still arguing about
 *     Croatia", "— usually decided before the flights go up", and a scribble
 *     on every coupon's counterfoil. A fourth voice, in a face nobody has to
 *     read, commenting on copy that already carried itself.
 *   - "Sign up with Google or an email and password", which described the
 *     mechanics of the button beside it (venture CLAUDE.md: no instructional
 *     copy — the sign-up page shows both routes).
 *
 * That leaves the document in two faces, the serif and the typewriter, which
 * is what a printed pass is actually set in. `.hand` is untouched elsewhere —
 * it is still the ideas composer's face; it just isn't a marketing device.
 */
import type { CSSProperties, ReactNode } from "react";

import { getSession } from "@/server/access";
import { Badge, ButtonLink, Page, Stamp, type Tone } from "@/components/ui";

/* -------------------------------------------------------------------------- */
/* 2. The luggage tags                                                        */
/* -------------------------------------------------------------------------- */

/** `--string` is the angle the tag hangs at, `--tilt` how it settled. */
type Shape = {
  badge: string;
  tone: Tone;
  title: string;
  body: string;
  hang: CSSProperties;
};

const shapes: Shape[] = [
  {
    badge: "Six to nine people",
    tone: "marine",
    title: "The friends who go every year",
    body: "Too many to decide in a chat, not enough to want a project manager. Last year's book tells you what it actually cost.",
    hang: { "--string": "7deg", "--tilt": "-1.2deg" } as CSSProperties,
  },
  {
    badge: "Two households",
    tone: "open",
    title: "The families sharing a house",
    body: "One place, one week, one bill — and a clean answer to who paid the deposit and who's covering the food shop.",
    hang: { "--string": "-5deg", "--tilt": "0.9deg" } as CSSProperties,
  },
  {
    badge: "A weekend",
    tone: "neutral",
    title: "The stag, hen or birthday",
    body: "One person is organising it and quietly resenting it. Waypoint spreads the writing without spreading the arguing.",
    hang: { "--string": "4deg", "--tilt": "-0.6deg" } as CSSProperties,
  },
];

/* -------------------------------------------------------------------------- */
/* 3. The coupon book                                                         */
/* -------------------------------------------------------------------------- */

type Stop = {
  step: string;
  tab: string;
  title: string;
  body: string;
  /** The worked example on the coupon — the app's own texture, printed. */
  eg: { k: string; v: string }[];
  /**
   * The counterfoil's tint — that tab's own wash, always a token and never a
   * hex (see the colour rule in CLAUDE.md). It's the only place colour
   * identifies a tab on this page, and the tab's name is written next to it,
   * so nothing here is colour alone.
   */
  wash: string;
};

const stops: Stop[] = [
  {
    step: "Stop 01",
    tab: "Ideas",
    title: "Nobody can settle on where to go",
    body: "Everyone adds the places they would go — a link, a photo, a name someone half-remembers — and votes on each other's. The board shows which ideas the group actually likes, so the choice isn't whoever argued last.",
    eg: [
      { k: "4 votes", v: "Sicily — “hear me out”" },
      { k: "2 votes", v: "Puglia, if we can drive" },
      { k: "no votes", v: "That place Jonas saw once" },
    ],
    wash: "var(--highlight-2)",
  },
  {
    step: "Stop 02",
    tab: "Dates",
    title: "Finding the one week everyone can do",
    body: "Each person shades in the days they're free. Waypoint overlaps all of it and shows which runs of days work and who's missing from each, so a date gets picked without another poll in the chat.",
    eg: [
      { k: "5 free", v: "12–19 Sep · the one everyone can do" },
      { k: "3 free", v: "26 Sep–3 Oct · Tom's away" },
    ],
    wash: "var(--pen-2)",
  },
  {
    step: "Stop 03",
    tab: "Route",
    title: "Deciding the order, and the nights in each place",
    body: "Put the chosen places in the order you'll visit them and give each one its nights. The nights are totalled against the length of the trip, so a route that doesn't fit says so.",
    eg: [
      { k: "2 nights", v: "Catania" },
      { k: "3 nights", v: "Taormina" },
      { k: "2 nights", v: "Syracuse" },
    ],
    wash: "var(--sheet-3)",
  },
  {
    step: "Stop 04",
    tab: "Days",
    title: "Filling in what happens on each day",
    body: "Every day gets what's planned, roughly when, and who's holding the tickets. Days left mostly empty stay that way — this is a plan, not a schedule.",
    eg: [
      { k: "09:30", v: "Market, then coffee at Bam Bar" },
      { k: "13:00", v: "Isola Bella — Jonas has the tickets" },
      { k: "20:00", v: "Dinner, table for 7" },
    ],
    wash: "var(--green-2)",
  },
  {
    step: "Stop 05",
    tab: "Money",
    title: "Working out who owes who",
    body: "Everyone logs what they paid and how it was split. Waypoint nets it all off to one figure per person. It records the debt — no money moves through Waypoint.",
    eg: [
      { k: "£1,240", v: "spent, across 14 expenses" },
      { k: "£177", v: "each, near enough" },
      { k: "£84", v: "owed to Mei by 3 people" },
    ],
    wash: "var(--red-2)",
  },
  {
    step: "Stop 06",
    // Not a tab — there is no "After" tab in the six. It's what happens to a
    // trip once it ends, so the counterfoil takes the neutral wash rather
    // than borrowing a tab's colour.
    tab: "After",
    title: "Keeping the trip after it's over",
    body: "A finished trip is archived rather than deleted: the dates, the route, the days and the final bill stay readable, so the next trip starts from what actually happened.",
    eg: [
      { k: "Sicily", v: "7 nights · settled" },
      { k: "Porto", v: "4 nights · settled" },
    ],
    wash: "var(--sheet-2)",
  },
];

function Coupon({ stop }: { stop: Stop }) {
  return (
    <article className="coupon">
      <div
        className="counterfoil"
        style={{ "--wash": stop.wash } as CSSProperties}
      >
        <p className="typed">{stop.step}</p>
        {/* 900px, not a `md:` — that's where `.counterfoil` turns from a
            column into a baseline-aligned row (globals.css), and the top
            margin belongs to the column form only. */}
        <p className="mt-1 text-[1.3rem] font-semibold leading-tight max-[900px]:mt-0 lg:text-[1.45rem]">
          {stop.tab}
        </p>
      </div>

      <div className="p-5 sm:px-6">
        <h3 className="text-[1.1rem]">{stop.title}</h3>
        <p className="mt-2 max-w-[60ch] text-[14.5px] text-ink-soft">
          {stop.body}
        </p>
        <div className="mt-4 border-t border-rule pt-3">
          {stop.eg.map((row) => (
            <div key={row.k + row.v} className="flex items-baseline gap-4 py-0.5">
              <span className="nums w-[6.5rem] flex-none text-right text-[13px] text-pen">
                {row.k}
              </span>
              <span className="text-[14px]">{row.v}</span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */

function SectionHead({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="max-w-[62ch]">
      <p className="typed">{label}</p>
      <h2 className="mt-1.5 text-[clamp(1.4rem,3vw,1.9rem)]">{title}</h2>
      {children ? <p className="mt-2 text-ink-soft">{children}</p> : null}
    </div>
  );
}

/**
 * One printed row on the pass's stub: what it is, and where it stands.
 * `.doc-field-*` is the typed key/value pair; a stub row is the wider
 * baseline-aligned version of it, so the two read as the same printing.
 */
function StubRow({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-rule py-2 last:border-b-0">
      <span className="text-sm text-ink-soft">{k}</span>
      {children}
    </div>
  );
}

export default async function LandingPage() {
  const session = await getSession();

  return (
    <Page wide>
      {/* ==================== 1. THE PASS ================================= */}
      <section className="pt-2 sm:pt-4">
        <div className="pass">
          <div className="pass-body">
            <h1 className="font-display text-[clamp(2rem,5.2vw,3.35rem)] font-semibold leading-[1.05] tracking-[-0.025em]">
              <span className="hl hl-red">Group</span> trip planning,{" "}
              <span className="hl hl-green">sorted</span>.
            </h1>
            <p className="mt-4 max-w-[34ch] text-[1.05rem] text-ink-soft">
              Everyone writes in the same book — the places, the free days, the
              receipts — and Waypoint keeps the running answer.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              {session?.user ? (
                <>
                  <ButtonLink href="/trips" variant="primary">
                    Get planning!
                  </ButtonLink>
                  <ButtonLink href="/explore" variant="secondary">
                    Get inspired
                  </ButtonLink>
                </>
              ) : (
                <>
                  <ButtonLink href="/signup" variant="primary">
                    Get planning!
                  </ButtonLink>
                  {/* /explore is behind `requireUser`, so the label keeps its
                      promise: sign in and you land on it, not on /trips. */}
                  <ButtonLink href="/login?redirect=%2Fexplore" variant="secondary">
                    Get inspired
                  </ButtonLink>
                </>
              )}
            </div>

            {/* The printed fields along the foot of a pass. Typed, never
                handwritten — they're figures. */}
            <div className="mt-8 flex flex-wrap gap-7 border-t border-dashed border-rule pt-4">
              <div>
                <p className="doc-field-k">Party</p>
                <p className="doc-field-v mt-1">7 friends</p>
              </div>
              <div>
                <p className="doc-field-k">Decided in</p>
                <p className="doc-field-v mt-1">11 days</p>
              </div>
              <div>
                <p className="doc-field-k">Chat polls</p>
                <p className="doc-field-v mt-1">0</p>
              </div>
            </div>

          </div>

          {/* The tear-off stub: a static illustrative sample of the product's
              own overview, not a live query (see the file header). */}
          <aside className="pass-stub">
            <h2 className="typed mb-3">Sicily · late Sept</h2>
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
              <Badge tone="open">2 blank</Badge>
            </StubRow>
            <div className="mt-5">
              <Stamp>Agreed</Stamp>
            </div>
          </aside>
        </div>
      </section>

      {/* ==================== 2. THE LUGGAGE TAGS ========================= */}
      <section className="mt-16">
        <SectionHead
          label="Who it's for"
          title="Built for the group that can't get a straight answer out of itself."
        />
        <div className="mt-8 grid gap-7 md:grid-cols-3">
          {shapes.map((s) => (
            <div key={s.title} className="luggage" style={s.hang}>
              <div className="luggage-card">
                <Badge tone={s.tone}>{s.badge}</Badge>
                <h3 className="mt-2.5 text-[1.05rem]">{s.title}</h3>
                <p className="mt-2 text-sm text-ink-soft">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== 3. THE COUPON BOOK ========================== */}
      <section className="mt-16">
        <SectionHead
          label="The whole journey, one page"
          title="Six stops between “we should go somewhere” and “that's settled”."
        >
          Nothing here is a wizard. A coupon opens when the group is ready for
          it, and a trip that already knows where it&rsquo;s going tears straight
          through to the route.
        </SectionHead>

        <div className="book mt-8">
          {stops.map((stop) => (
            <Coupon key={stop.step} stop={stop} />
          ))}
        </div>
      </section>

      {/* ==================== 4. THE ENTRY STAMP ========================== */}
      {/* Rendered signed in or out. The old page hid its closing block from
          members, which left the document with no last page — and the line it
          carries is true either way: an invite link shows the trip before it
          asks for anything. Only the buttons change. */}
      <section className="mt-16">
        <div className="grid items-center gap-9 md:grid-cols-2">
          <div className="justify-self-center">
            <div className="impression">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em]">
                Waypoint · admitted
              </p>
              <p className="my-1.5 text-[1.15rem] font-semibold">
                Got a link from a friend?
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em]">
                No account needed to look
              </p>
            </div>
          </div>

          <div>
            <p className="typed">Before you sign anything</p>
            <h2 className="mt-1.5 text-[clamp(1.4rem,3vw,1.9rem)]">
              Open the link and you&rsquo;ll see the trip first.
            </h2>
            <p className="mt-2 text-ink-soft">
              A preview of where the group has got to — the dates, the route,
              what&rsquo;s still open — before you make an account. Start your
              own the same way.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {session?.user ? (
                <>
                  <ButtonLink href="/trips" variant="primary">
                    Start your own trip
                  </ButtonLink>
                  <ButtonLink href="/explore" variant="secondary">
                    Get inspired
                  </ButtonLink>
                </>
              ) : (
                <>
                  <ButtonLink href="/signup" variant="primary">
                    Start your own trip
                  </ButtonLink>
                  <ButtonLink href="/login?redirect=%2Fexplore" variant="secondary">
                    Get inspired
                  </ButtonLink>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* The machine-readable strip off the bottom of a passport. Decoration
          and the page's closing rule at once — see `.mrz` in globals.css. */}
      {/* Bled to the sheet's own edges, so it reads as the foot of the page
          rather than as one more panel on it. The left inset cancels the red
          margin's gutter (`pl-[38px]` / `sm:pl-[76px]` in `Page`), not the
          plain horizontal padding — they differ. */}
      <div
        className="mrz mt-14 -mb-7 -ml-[38px] -mr-5 sm:-mb-8 sm:-ml-[76px] sm:-mr-8"
        aria-hidden="true"
      >
        <pre>
          {
            "WPT<GBR<SICILY<<LATE<SEPTEMBER<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<7PAX\nCATANIA<2N<TAORMINA<3N<SYRACUSE<2N<<120919SEP<<GBP177EA<<<<<<AGREED<<<<<<<<<9"
          }
        </pre>
      </div>
    </Page>
  );
}
