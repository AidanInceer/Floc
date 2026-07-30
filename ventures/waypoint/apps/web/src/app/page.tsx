/**
 * `/` — marketing landing (ticket 05, 19). Public.
 *
 * Ticket 19's data-source question: neither real trips nor seeded database
 * rows — a static, hand-written sample of the product's own UI, built from
 * the real design tokens. Needs no database read, so this page stays a
 * plain server component with zero queries.
 *
 * The hero follows `docs/mockups/homepage-hero-b-beforeafter.html`, adopted
 * after feedback that the page had no selling point that landed immediately.
 * The headline is the part that worked and is unchanged; the 40-word lede is
 * gone entirely, replaced by the same trip shown twice — loose notes on the
 * left, the settled sheet on the right.
 *
 * Everything below the hero still follows `docs/mockups/homepage-pinboard.html`:
 * who it's for, then the six-stop journey as a route down the page with sticky
 * notes either side. The mockup's group-chat before/after is no longer here —
 * see ticket 44 below.
 */
import type { ReactNode } from "react";

import Link from "next/link";

import { getSession } from "@/lib/access";
import { enabledProviders } from "@/lib/auth";
import {
  Avatar,
  AvatarRow,
  Badge,
  ButtonLink,
  Card,
  CardHeader,
  Page,
  Stamp,
  cx,
  type Tone,
} from "@/components/ui";

/* -------------------------------------------------------------------------- */
/* The hero                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The "before" panel — everything anyone said, still loose. Real scribbles,
 * because this half of the argument only lands if it's familiar.
 *
 * Ticket 41: they were absolutely positioned at hand-picked percentages with
 * text-driven heights, so they came out oblong and the bottom row hung outside
 * the dashed panel at narrow widths. Squares in a two-column grid now — the
 * cell is what bounds them, so nothing can escape the box.
 *
 * `mess` is the second half of the fix: a grid of six identical squares reads as
 * a colour swatch, so each note takes its own size, tilt and nudge within its
 * cell. Sizes stay in the 74–92% band and tilts under 8 degrees — past either
 * the notes stop being readable, which was the whole point of moving them.
 */
const loose: { said: string; tone: string; mess: string }[] = [
  { said: "Sicily — hear me out", tone: "note-yellow", mess: "w-[88%] -rotate-[4.5deg] translate-x-[3px]" },
  { said: "Puglia if we can drive", tone: "note-sky", mess: "w-[78%] rotate-[6deg] justify-self-end translate-y-[7px]" },
  { said: "can't do w/c 12th", tone: "note-coral", mess: "w-[74%] rotate-[3deg] translate-x-[10px] -translate-y-[4px]" },
  { said: "£600 each, max", tone: "note-mint", mess: "w-[86%] -rotate-[6.5deg] justify-self-end" },
  { said: "Ruth can drive", tone: "note-lilac", mess: "w-[80%] -rotate-[2.5deg] translate-x-[14px] -translate-y-[6px]" },
  { said: "3 nights minimum?", tone: "note-yellow", mess: "w-[92%] rotate-[7deg] justify-self-end translate-y-[4px]" },
];

/**
 * The post-it canvas beside the headline. Decoration and nothing else: no word
 * on it is load-bearing, so it carries no text at all — every note a visitor
 * needs to read is in the `fan` below. It renders as its own grid cell rather
 * than as a layer behind the copy from `lg:` up; below that it sits behind the
 * headline, faded, which is why the stock here is deliberately restricted.
 *
 * Full stock, coral and mint included — see `.hero-canvas` in globals.css for
 * how the overlap with "notes"/"plan" is actually avoided (a breakpoint, not
 * a colour restriction).
 */
function HeroCanvas() {
  const notes = [
    { tone: "var(--note-yellow)", edge: "var(--note-yellow-edge)", x: 18, y: 8, s: 126, r: -8 },
    { tone: "var(--note-sky)", edge: "var(--note-sky-edge)", x: 176, y: 74, s: 112, r: 6 },
    { tone: "var(--note-coral)", edge: "var(--note-coral-edge)", x: 318, y: 12, s: 118, r: 3 },
    { tone: "var(--note-mint)", edge: "var(--note-mint-edge)", x: 120, y: 216, s: 106, r: -5 },
    { tone: "var(--note-lilac)", edge: "var(--note-lilac-edge)", x: 302, y: 190, s: 114, r: 7 },
    { tone: "var(--note-yellow)", edge: "var(--note-yellow-edge)", x: 0, y: 306, s: 104, r: 4 },
  ];

  return (
    <div className="hero-canvas" aria-hidden="true">
      <svg viewBox="0 0 440 400" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="hero-note-shadow" x="-25%" y="-25%" width="160%" height="160%">
            <feDropShadow
              dx="2"
              dy="5"
              stdDeviation="5"
              floodColor="#23211c"
              floodOpacity="0.22"
            />
          </filter>
        </defs>
        <g filter="url(#hero-note-shadow)">
          {notes.map((n) => (
            <g
              key={`${n.x}-${n.y}`}
              transform={`translate(${n.x} ${n.y}) rotate(${n.r})`}
            >
              <rect width={n.s} height={n.s} rx="2" fill={n.tone} />
              <path
                d={`M${n.s} ${n.s * 0.8} L${n.s * 0.8} ${n.s} L${n.s} ${n.s} Z`}
                fill={n.edge}
              />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* The journey                                                                */
/* -------------------------------------------------------------------------- */

type Stop = {
  step: string;
  tab: string;
  tone: Tone;
  title: string;
  body: string;
  /** The worked example on the note — the app's own texture, on paper. */
  eg: { k: string; v: string }[];
  scribble: string;
  /** A token wash, never a hex — see the colour rule in CLAUDE.md. */
  paper: string;
  /** Pinned by hand, so nothing is quite square. */
  tilt: string;
};

const stops: Stop[] = [
  {
    step: "Stop 01",
    tab: "Ideas",
    tone: "marine",
    title: "Nobody can settle on where to go",
    body: "Everyone adds the places they would go — a link, a photo, a name someone half-remembers — and votes on each other's. The board shows which ideas the group actually likes, so the choice isn't whoever argued last.",
    eg: [
      { k: "4 votes", v: "Sicily — “hear me out”" },
      { k: "2 votes", v: "Puglia, if we can drive" },
      { k: "no votes", v: "That place Jonas saw once" },
    ],
    scribble: "Ruth added 6 of these in one evening",
    paper: "bg-highlight-soft",
    tilt: "-rotate-[0.7deg]",
  },
  {
    step: "Stop 02",
    tab: "Dates",
    tone: "open",
    title: "Finding the one week everyone can do",
    body: "Each person shades in the days they're free. Waypoint overlaps all of it and shows which runs of days work and who's missing from each, so a date gets picked without another poll in the chat.",
    eg: [
      { k: "5 free", v: "12–19 Sep · the one everyone can do" },
      { k: "3 free", v: "26 Sep–3 Oct · Tom's away" },
    ],
    scribble: "nobody had to ask twice",
    paper: "bg-pen-soft",
    tilt: "rotate-[0.6deg]",
  },
  {
    step: "Stop 03",
    tab: "Route",
    tone: "marine",
    title: "Deciding the order, and the nights in each place",
    body: "Put the chosen places in the order you'll visit them and give each one its nights. The nights are totalled against the length of the trip, so a route that doesn't fit says so.",
    eg: [
      { k: "2 nights", v: "Catania" },
      { k: "3 nights", v: "Taormina" },
      { k: "2 nights", v: "Syracuse" },
    ],
    scribble: "7 nights, 7 accounted for",
    paper: "bg-sheet-3",
    tilt: "-rotate-[0.5deg]",
  },
  {
    step: "Stop 04",
    tab: "Days",
    tone: "agreed",
    title: "Filling in what happens on each day",
    body: "Every day gets what's planned, roughly when, and who's holding the tickets. Days left mostly empty stay that way — this is a plan, not a schedule.",
    eg: [
      { k: "09:30", v: "Market, then coffee at Bam Bar" },
      { k: "13:00", v: "Isola Bella — Jonas has the tickets" },
      { k: "20:00", v: "Dinner, table for 7" },
    ],
    scribble: "the rest of Thursday is deliberately blank",
    paper: "bg-green-soft",
    tilt: "rotate-[0.8deg]",
  },
  {
    step: "Stop 05",
    tab: "Money",
    tone: "action",
    title: "Working out who owes who",
    body: "Everyone logs what they paid and how it was split. Waypoint nets it all off to one figure per person. It records the debt — no money moves through Waypoint.",
    eg: [
      { k: "£1,240", v: "spent, across 14 expenses" },
      { k: "£177", v: "each, near enough" },
      { k: "£84", v: "owed to Mei by 3 people" },
    ],
    scribble: "settled on the Sunday, no spreadsheet",
    paper: "bg-red-soft",
    tilt: "-rotate-[0.9deg]",
  },
  {
    step: "Stop 06",
    tab: "After",
    tone: "neutral",
    title: "Keeping the trip after it's over",
    body: "A finished trip is archived rather than deleted: the dates, the route, the days and the final bill stay readable, so the next trip starts from what actually happened.",
    eg: [
      { k: "Sicily", v: "7 nights · settled" },
      { k: "Porto", v: "4 nights · settled" },
    ],
    scribble: "“where was that bar in Ortigia?”",
    paper: "bg-sheet-2",
    tilt: "rotate-[0.5deg]",
  },
];

/** One cubic segment: `[c1x, c1y, c2x, c2y, x, y]`. */
type Seg = [number, number, number, number, number, number];

/*
 * The shape of each leg of the route, drawn as a chain of cubic segments in a
 * 0–100 box that starts at (50,0) and ends at (50,100).
 *
 * Three segments each rather than one, because a single arc per stop is a
 * shape a machine makes: identical, symmetrical, and obviously repeating
 * however much the control points are nudged. A leg that pushes out, drifts
 * back towards the centre and then wanders again reads as a line someone
 * walked. So the legs differ in how far out they go (leg 04 barely leaves the
 * centre; leg 05 goes nearly to the edge), where the widest point sits, and
 * how many times they change their mind on the way down.
 *
 * These are written as right-hand shapes; a leg whose note is on the right
 * mirrors every x about 50, so the route always wanders into the blank half
 * of the row and crosses back behind the next note.
 *
 * Two rules the numbers must keep: every leg starts and ends at x=50 (that's
 * where the pins are), and the first and last control points stay on the
 * right — mirroring then guarantees consecutive legs leave a pin heading the
 * way the previous one arrived, so the joins don't kink.
 */
const legs: Seg[][] = [
  // Out early and wide, then a long unhurried drift back.
  [
    [64, 8, 84, 15, 88, 31],
    [92, 44, 79, 55, 69, 65],
    [61, 74, 56, 88, 50, 100],
  ],
  // Reluctant: hugs the centre, changes its mind late and swings out low.
  [
    [58, 9, 67, 17, 64, 29],
    [61, 42, 74, 51, 77, 65],
    [80, 80, 61, 89, 50, 100],
  ],
  // The wanderer — out to the edge, nearly back to the line, out again.
  [
    [70, 6, 90, 13, 92, 27],
    [95, 41, 62, 45, 58, 57],
    [54, 71, 73, 84, 50, 100],
  ],
  // Barely leaves the centre. A stretch of the walk where nothing happens.
  [
    [55, 11, 66, 19, 64, 33],
    [62, 49, 71, 57, 67, 71],
    [65, 85, 57, 93, 50, 100],
  ],
  // The widest of the six, and the latest to turn back.
  [
    [67, 10, 87, 19, 93, 37],
    [96, 54, 83, 62, 71, 72],
    [63, 82, 56, 92, 50, 100],
  ],
  // Tight at the top, then a late lunge out and a quick return.
  [
    [54, 8, 63, 15, 60, 26],
    [57, 40, 85, 51, 86, 67],
    [88, 82, 61, 90, 50, 100],
  ],
];

/* Even the dashes vary — a pen doesn't lay down the same stitch twice. */
const dashes = ["6 6", "7 5", "5 7", "6 5", "8 6", "5 6"];

/**
 * One leg of the dashed route, stretched to its stop's own height. See the
 * shape table above, and the geometry note above `.route` in globals.css for
 * why the stroke is non-scaling.
 */
/*
 * How far the shapes above are allowed to wander, as a fraction of what they
 * describe. Tuned down from 1 by eye: the shapes were right but the swing was
 * loud enough to compete with the notes.
 */
const AMPLITUDE = 0.8;

function RouteLeg({ leg, bulge }: { leg: number; bulge: "left" | "right" }) {
  const x = (v: number) => {
    const out = 50 + (v - 50) * AMPLITUDE;
    return Math.round((bulge === "right" ? out : 100 - out) * 100) / 100;
  };
  const d = legs[leg % legs.length]
    .map(
      ([c1x, c1y, c2x, c2y, ex, ey]) =>
        `C ${x(c1x)} ${c1y}, ${x(c2x)} ${c2y}, ${x(ex)} ${ey}`,
    )
    .join(" ");

  return (
    <span aria-hidden className="route-leg">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <path
          d={`M 50 0 ${d}`}
          fill="none"
          stroke="var(--rule-2)"
          strokeWidth="2"
          strokeDasharray={dashes[leg % dashes.length]}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </span>
  );
}

function JourneyNote({ stop }: { stop: Stop }) {
  return (
    <div
      className={`note-tape relative rounded-sm border border-rule p-[18px] pb-4 shadow-lifted ${stop.paper} ${stop.tilt}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10.5px] tracking-[0.1em] text-ink-faint">
          {stop.step}
        </span>
        <Badge tone={stop.tone}>{stop.tab}</Badge>
      </div>
      <h3 className="mt-1.5 text-[1.15rem]">{stop.title}</h3>
      <p className="mt-2 text-[14.5px] text-ink-soft">{stop.body}</p>
      <div className="mt-3.5 rounded-sm border border-rule-strong bg-sheet/70 px-3 py-2.5">
        {stop.eg.map((row) => (
          <div
            key={row.k + row.v}
            className="flex items-baseline gap-2.5 py-0.5 [&+div]:border-t [&+div]:border-dotted [&+div]:border-rule-strong"
          >
            <span className="nums min-w-[62px] text-[11.5px] text-ink-faint">
              {row.k}
            </span>
            <span className="text-[13.5px]">{row.v}</span>
          </div>
        ))}
      </div>
      <span className="hand mt-3 inline-block -rotate-[0.6deg] text-[13.5px] text-pen">
        {stop.scribble}
      </span>
    </div>
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

/*
 * Ticket 44: the "A group chat is a terrible place to keep a decision" section
 * is gone, along with the `chat`/`settled` sample data it rendered. The hero's
 * before/after already makes the same argument in a picture, one screen up, and
 * making it twice read as the page labouring the point.
 */

const shapes: { badge: string; tone: Tone; title: string; body: string }[] = [
  {
    badge: "Six to nine people",
    tone: "marine",
    title: "The friends who go every year",
    body: "Too many to decide in a chat, not enough to want a project manager. Last year's book tells you what it actually cost.",
  },
  {
    badge: "Two households",
    tone: "open",
    title: "The families sharing a house",
    body: "One place, one week, one bill — and a clean answer to who paid the deposit and who's covering the food shop.",
  },
  {
    badge: "A weekend",
    tone: "neutral",
    title: "The stag, hen or birthday",
    body: "One person is organising it and quietly resenting it. Waypoint spreads the writing without spreading the arguing.",
  },
];

export default async function LandingPage() {
  const session = await getSession();

  return (
    <Page wide>
      <section className="relative pt-8 sm:pt-10">
        {/* Below `sm:` the post-it canvas is an overlay pinned to the top of
            the sheet, sitting *behind* the copy and faded out before it reaches
            the headline. From `sm:` up — a single column is still narrow enough
            there for a note to land right behind "notes"/"plan" otherwise — it
            becomes a real grid cell to the right of the copy, so it can never
            underlap the headline or the buttons again. See `.hero-canvas` in
            globals.css. */}
        {/* 23rem, not narrower: below it the two buttons (197px + 117px + the
            gap) stop fitting on one line and the H1 breaks into five. */}
        <div className="grid gap-8 sm:grid-cols-[minmax(0,23rem)_minmax(0,1fr)] sm:items-center">
          <div className="relative z-10">
            <p className="typed">Start the trip as notes. Finish it as a plan</p>
            <h1 className="mt-2.5 font-display text-[clamp(2rem,5.4vw,3.4rem)] font-semibold leading-[1.05] tracking-[-0.025em]">
              <span className="hl hl-red">Group</span> trip planning, <span className="hl hl-green">sorted</span>.
            </h1>
            
            <div className="mt-6 flex flex-wrap items-center gap-3">
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
            <p className="hand mt-6 inline-block -rotate-1 text-[15px] text-pen">
              — started 14 Feb, still arguing about Croatia
            </p>
            {!session?.user && enabledProviders.google ? (
              <p className="mt-3 text-xs text-ink-faint">
                Sign up with Google or an email and password.
              </p>
            ) : null}
          </div>

          <HeroCanvas />
        </div>

        {/* The lede's job, done as a picture: the same trip twice. */}
        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_112px_minmax(0,1fr)] lg:items-stretch lg:gap-0">
          <div className="flex flex-col">
            <div className="mb-3">
              <p className="typed">Week one</p>
              <h2 className="mt-1 text-[1.15rem] font-semibold">
                Everything anyone said
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                Six people, four destinations, nobody sure what&rsquo;s still live.
              </p>
            </div>
            <div className="fan grow" aria-hidden="true">
              {loose.map((n) => (
                <span key={n.said} className={cx("fan-note", n.tone, n.mess)}>
                  <span className="fan-note-text">{n.said}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Just the label, no arrow. A drawn arrow has to point somewhere,
              and the panels sit side by side on a desktop but stacked on a
              phone — so whichever way it pointed it was wrong at one of the two
              widths. The words carry the gap on their own. */}
          <div className="hero-gap" aria-hidden="true">
            <span className="hero-gap-label">a fortnight later</span>
          </div>

          <div className="flex flex-col">
            <div className="mb-3">
              <p className="typed">Week three</p>
              {/* Ticket 42: the old caption ("One page everyone agrees on" /
                  "Same conversation, sorted into dates, a route and a bill")
                  described the picture without saying what it's worth. What
                  the panel is actually showing is a state against every
                  decision — so the copy names that, and the answer to the
                  question the group keeps re-asking in the chat. */}
              <h2 className="mt-1 text-[1.15rem] font-semibold">
                One page that answers every question
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                Dates, route, money — each with where it stands written next to
                it, so nobody scrolls back through the chat to find out.
              </p>
            </div>

            {/* Static illustrative mock of the product's own overview tab —
                hand-written sample data, not a live query (see file header). */}
            <Card className="grow shadow-raised">
              <CardHeader
                title="Sicily, late September"
                hint="7 members · 12 Sep – 19 Sep"
                actions={<Stamp>Agreed</Stamp>}
              />
              <div className="space-y-3 p-4">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-ink-soft">
                    Who&rsquo;s in
                  </p>
                  <AvatarRow
                    people={[
                      { name: "Priya Shah" },
                      { name: "Tom Okafor" },
                      { name: "Mei Lin" },
                      { name: "Jonas Weber" },
                      { name: "Ruth Adeyemi" },
                      { name: "Sam Cole" },
                      { name: "Ana Ferreira" },
                    ]}
                  />
                </div>
                <div className="flex items-baseline justify-between gap-3 rounded-md border border-rule bg-sheet-2 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-soft">
                    Dates
                  </p>
                  <p className="font-mono text-sm tabular-nums text-ink">
                    12–19 Sep · 5 of 7 free
                  </p>
                </div>
                <div className="rounded-md border border-rule bg-sheet-2 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-ink-soft">
                    Route
                  </p>
                  <p className="text-sm text-ink">
                    Catania → Taormina → Syracuse → Catania
                  </p>
                </div>
                <div className="flex items-center justify-between rounded-md border border-rule bg-sheet-2 p-3">
                  <div>
                    <p className="text-sm font-medium text-ink">Money</p>
                    <p className="text-xs text-ink-soft">
                      Mei is owed £84 across 3 people
                    </p>
                  </div>
                  <Badge tone="action">Needs settling</Badge>
                </div>
                <div className="flex items-center gap-2 rounded-md border border-rule bg-sheet-2 p-3">
                  <Avatar name="Tom Okafor" size={24} />
                  <p className="text-sm text-ink-soft">
                    <span className="font-medium text-ink">Tom</span> nudged the
                    group about picking a hotel in Taormina
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ==================== WHO IT'S FOR ================================ */}
      <section className="mt-16">
        <SectionHead
          label="Who it's for"
          title="Built for the group that can't get a straight answer out of itself."
        />
        <div className="mt-7 grid gap-5 md:grid-cols-3">
          {shapes.map((s) => (
            <div key={s.title}>
              <Badge tone={s.tone}>{s.badge}</Badge>
              <h3 className="mt-1.5 text-[1.05rem]">{s.title}</h3>
              <p className="mt-1.5 text-sm text-ink-soft">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== THE JOURNEY ================================== */}
      <section className="mt-16">
        <SectionHead
          label="The whole journey, one page"
          title="Six stops between “we should go somewhere” and “that's settled”."
        >
          Nothing here is a wizard. A stop opens when the group is ready for it,
          and a trip that already knows where it&rsquo;s going skips straight to the
          route.
        </SectionHead>

        <ol className="route mt-9 list-none p-0">
          {stops.map((stop, i) => (
            <li key={stop.step} className="route-stop">
              {/* Even index = note on the left, so the route wanders right. */}
              <RouteLeg leg={i} bulge={i % 2 === 0 ? "right" : "left"} />
              <span aria-hidden className="route-pin route-pin-start" />
              {i === stops.length - 1 ? (
                <span aria-hidden className="route-pin route-pin-end" />
              ) : null}
              <div className="route-note-wrap">
                <JourneyNote stop={stop} />
              </div>
            </li>
          ))}
        </ol>
      </section>

      {!session?.user ? (
        <section className="mt-16 border-t border-rule pt-8 text-center">
          <p className="font-display text-lg font-semibold">
            Got a link from a friend?
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            Open it and you&rsquo;ll see a preview of the trip before you sign up.
          </p>
          <div className="mt-4">
            <Link href="/signup" className="text-sm text-pen underline">
              Or start your own trip
            </Link>
          </div>
        </section>
      ) : null}

      {/* ==================== CONTACT & FEEDBACK ========================== */}
      {/* Ticket 01 (waypoint-v0.2) is closed as "not yet" — the torn-off
          "Leave a note" form that used to sit here was disabled presentation
          with no submit target, and it's gone until a backend exists for it.
          Email is the only channel for now. */}
      {/* <section id="contact" className="mt-16 border-t border-rule pt-8">
        <SectionHead
          label="Contact & feedback"
          title="Tell us what your group actually needed."
        >
          Waypoint is pre-launch and being shaped by the trips people are
          planning right now. If something's missing, awkward or plain wrong,
          say so — it's read by the person who builds it, and it changes what
          gets built next.
        </SectionHead>

        <div className="mt-4 grid gap-3">
          <div className="flex items-baseline gap-2.5">
            <span className="typed min-w-[100px]">Email</span>
            <a href="mailto:hello@waypoint.travel" className="text-pen">
              hello@waypoint.travel
            </a>
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="typed min-w-[100px]">Something broke</span>
            <a href="mailto:hello@waypoint.travel?subject=Something broke" className="text-pen">
              Tell us what you were doing
            </a>
          </div>
        </div>

        <p className="hand mt-5 inline-block -rotate-1 text-pen">
          — usually answered within a day
        </p>
      </section> */}
    </Page>
  );
}
