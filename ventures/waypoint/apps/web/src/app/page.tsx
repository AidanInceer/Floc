/**
 * `/` — marketing landing (ticket 05, 19; reskinned 192). Public, static —
 * illustrative sample UI, not a database read. White ground + domain pastels
 * (ticket 187): each stop wears the pastel its trip tab owns, so the marketing
 * page and the product teach one colour language.
 */
import type { ReactNode } from "react";
import Link from "next/link";

import { getSession } from "@/server/access";
import { ButtonLink, cx } from "@/components/ui";

type Stop = {
  step: string;
  tab: string;
  title: string;
  body: string;
  eg: { k: string; v: string }[];
  /** Card surface + ink, both tokens — the pastel this tab owns in the product. */
  skin: string;
};

// Ideas=butter, Dates=peri, Days=blush (route), Money=mint (CLAUDE.md domain
// map). "After" isn't a tab, so it stays neutral rather than borrow blue.
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
    skin: "bg-butter text-butter-ink",
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
    skin: "bg-peri text-peri-ink",
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
    skin: "bg-blush text-blush-ink",
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
    skin: "bg-mint text-mint-ink",
  },
  {
    step: "Stop 05",
    tab: "After",
    title: "Keeping the trip after it's over",
    body: "A finished trip is archived rather than deleted: the dates, the route, the days and the final bill stay readable, so the next trip starts from what actually happened.",
    eg: [
      { k: "Sicily", v: "7 nights · settled" },
      { k: "Porto", v: "4 nights · settled" },
    ],
    skin: "bg-sheet-2 text-ink",
  },
];

type Shape = { badge: string; title: string; body: string; skin: string };

const shapes: Shape[] = [
  {
    badge: "Six to nine people",
    title: "The friends who go every year",
    body: "Too many to decide in a chat, not enough to want a project manager. Last year's book tells you what it actually cost.",
    skin: "bg-peri text-peri-ink",
  },
  {
    badge: "Two households",
    title: "The families sharing a house",
    body: "One place, one week, one bill — and a clean answer to who paid the deposit and who's covering the food shop.",
    skin: "bg-mint text-mint-ink",
  },
  {
    badge: "A weekend",
    title: "The stag, hen or birthday",
    body: "One person is organising it and quietly resenting it. Waypoint spreads the writing without spreading the arguing.",
    skin: "bg-butter text-butter-ink",
  },
];

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
    <div className="max-w-[54ch]">
      <p className="typed">{label}</p>
      <h2 className="mt-2 text-[clamp(1.7rem,3.5vw,2.5rem)]">{title}</h2>
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
  const start = session?.user ? "/trips" : "/signup";
  const inspire = session?.user ? "/explore" : "/login?redirect=%2Fexplore";

  return (
    <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6 sm:pt-10">
      {/* ── hero ─────────────────────────────────────────────────────── */}
      <section className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.82fr)] lg:gap-16">
        <div>
          <h1 className="font-display text-[clamp(2.4rem,5.4vw,4rem)] font-semibold leading-[1.04] tracking-[-0.03em]">
            <span className="hl hl-red">Group</span> trip planning,{" "}
            <span className="hl hl-green">sorted</span>.
          </h1>
          <p className="mt-6 max-w-[36ch] text-md text-ink-soft">
            Everyone writes in the same book — the places, the free days, the
            receipts — and Waypoint keeps the running answer.
          </p>

          {/* One call to action above the fold (ticket 192); the secondary
              "get inspired" route waits until the invite band below. */}
          <div className="mt-8">
            <ButtonLink href={start} variant="primary">
              Get planning!
            </ButtonLink>
          </div>

          <div className="mt-12 flex flex-wrap gap-11 border-t border-rule pt-6">
            {[
              { k: "Party", v: "7 friends" },
              { k: "Decided in", v: "11 days" },
              { k: "Chat polls", v: "0" },
            ].map((s) => (
              <div key={s.k}>
                <p className="typed">{s.k}</p>
                <p className="mt-1.5 font-display text-xl font-semibold tracking-tight">
                  {s.v}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Illustrative sample, not a live query — the shape of a settled plan. */}
        <aside className="lift rounded-lg bg-peri p-6 text-peri-ink sm:p-7">
          <h2 className="text-lg">Sicily</h2>
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
                2 blank
              </span>
            </StubRow>
          </div>
          <span className="mt-6 inline-flex items-center rounded-full bg-mint px-4 py-2 font-display text-sm font-semibold text-mint-ink">
            Agreed
          </span>
        </aside>
      </section>

      {/* ── who it's for ─────────────────────────────────────────────── */}
      <section className="mt-24">
        <SectionHead
          label="Who it's for"
          title="Built for the group that can't get a straight answer out of itself."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {shapes.map((s) => (
            <article
              key={s.title}
              className={cx("lift rounded-lg p-6", s.skin)}
            >
              <span className="inline-flex items-center rounded-full bg-sheet/70 px-3.5 py-1.5 text-xs font-semibold">
                {s.badge}
              </span>
              <h3 className="mt-4 text-lg">{s.title}</h3>
              <p className="mt-3 text-sm opacity-85">{s.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── the stops ────────────────────────────────────────────────── */}
      <section className="mt-24">
        <SectionHead
          label="The whole journey, one page"
          title="Six stops between “we should go somewhere” and “that's settled”."
        >
          Nothing here is a wizard. A coupon opens when the group is ready for
          it, and a trip that already knows where it&rsquo;s going tears straight
          through to the route.
        </SectionHead>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {stops.map((stop) => (
            <Link
              key={stop.step}
              href={start}
              className={cx("lift block rounded-lg p-7", stop.skin)}
            >
              <p className="typed text-current">{stop.step}</p>
              <p className="mt-1 font-display text-2xl font-semibold tracking-tight">
                {stop.tab}
              </p>
              <h3 className="mt-4 text-lg">{stop.title}</h3>
              <p className="mt-3 max-w-[46ch] text-sm opacity-85">{stop.body}</p>
              <div className="mt-5 flex flex-col gap-2">
                {stop.eg.map((row) => (
                  <div
                    key={row.k + row.v}
                    className="flex items-baseline gap-3.5 rounded-md bg-sheet/60 px-3.5 py-2 text-sm"
                  >
                    <span className="nums min-w-[74px] flex-none text-xs opacity-75">
                      {row.k}
                    </span>
                    <span>{row.v}</span>
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── invite band ──────────────────────────────────────────────── */}
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
          <p className="typed">Before you sign anything</p>
          <h2 className="mt-2 text-[clamp(1.5rem,3vw,2.1rem)]">
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
