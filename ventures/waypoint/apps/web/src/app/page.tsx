/**
 * `/` — marketing landing (ticket 05, 19). Public, static — illustrative
 * sample UI, not a database read. Follows
 * `docs/mockups/homepage-g-boardingpass.html`.
 */
import type { CSSProperties, ReactNode } from "react";

import { getSession } from "@/server/access";
import { Badge, ButtonLink, Page, Stamp, type Tone } from "@/components/ui";

/** `--string` = hang angle, `--tilt` = settled tilt. */
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

type Stop = {
  step: string;
  tab: string;
  title: string;
  body: string;
  eg: { k: string; v: string }[];
  /** Counterfoil tint, always a token (colour rule, CLAUDE.md). */
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
    tab: "Days",
    title: "Where you sleep, and what happens each day",
    body: "Say where the group is staying on each day — a run of days in one place is one stay, drawn as one bar — and fill in what's planned, roughly when, and who's holding the tickets. Days left mostly empty stay that way: this is a plan, not a schedule.",
    eg: [
      { k: "3 nights", v: "Taormina, then 2 in Syracuse" },
      { k: "09:30", v: "Market, then coffee at Bam Bar" },
      { k: "20:00", v: "Dinner, table for 7" },
    ],
    wash: "var(--green-2)",
  },
  {
    step: "Stop 04",
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
    step: "Stop 05",
    // Not a real tab — neutral wash, not a borrowed tab colour.
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
        {/* 900px matches `.counterfoil`'s breakpoint (globals.css); mt-0 only in the row form. */}
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
                  {/* /explore is behind requireUser — sign-in redirects there, not /trips. */}
                  <ButtonLink href="/login?redirect=%2Fexplore" variant="secondary">
                    Get inspired
                  </ButtonLink>
                </>
              )}
            </div>

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

          {/* Illustrative sample, not a live query. */}
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

      {/* Signed in or out, an invite link shows the trip before asking for anything — only the buttons change. */}
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

      {/* Decorative MRZ strip (`.mrz`, globals.css); left inset cancels `Page`'s red-margin gutter, not plain padding. */}
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
