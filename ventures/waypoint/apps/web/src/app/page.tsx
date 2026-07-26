/**
 * `/` — marketing landing (ticket 05, 19). Public.
 *
 * Ticket 19's data-source question: neither real trips nor seeded database
 * rows — a static, hand-written sample of the product's own UI, built from
 * the real design tokens. Needs no database read, so this page stays a
 * plain server component with zero queries.
 *
 * Everything below the hero follows `docs/mockups/homepage-pinboard.html`:
 * the six-stop journey as a route down the page with sticky notes either
 * side, the group-chat before/after, who it's for, and a contact block.
 */
import type { ReactNode } from "react";

import Link from "next/link";

import { getSession } from "@/lib/access";
import { enabledProviders } from "@/lib/auth";
import {
  Avatar,
  AvatarRow,
  Badge,
  Button,
  ButtonLink,
  Card,
  CardHeader,
  Field,
  Input,
  Page,
  Select,
  Stamp,
  Textarea,
  type Tone,
} from "@/components/ui";

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
    title: "Everyone throws places in",
    body: "A link, a photo, a name someone half-remembers. Vote when it helps the group decide; ignore the votes when it doesn't.",
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
    title: "The weeks people can't do",
    body: "Everyone shades in their bad weeks and the overlap surfaces itself. It never waits for a full house — five out of seven is usually the answer.",
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
    title: "Put the stops in order",
    body: "Drag the favourites into a sequence and give each one its nights. Waypoint keeps the arithmetic honest so nobody plans four cities in three days.",
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
    title: "The day-by-day fills itself in",
    body: "Each day gets the things worth doing, roughly in the order you'd do them. Half-empty days are fine — most of them should be.",
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
    title: "Who owes who, worked out once",
    body: "Log what you paid as you go, split it evenly or exactly. At the end it's one number each — a ledger, not a payment app.",
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
    title: "The book stays on the shelf",
    body: "The trip is archived, not deleted: the route, the photos of receipts and the arguments are all still there when the group plans the next one.",
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

const chat: { name: string; said: string }[] = [
  { name: "Mei Lin", said: "so are we doing the 12th or not" },
  { name: "Tom Okafor", said: "I said earlier I can't do that week 😅" },
  { name: "Ruth Adeyemi", said: "wait which hotel did we agree on" },
  { name: "Priya Shah", said: "[link to a hotel, sent 11 days ago]" },
  { name: "Jonas Weber", said: "I paid the deposit btw, will work it out later" },
  { name: "Sam Cole", said: "later never comes lol" },
];

const settled: { what: string; detail: string; tone: Tone; state: string }[] = [
  {
    what: "Dates",
    detail: "12–19 Sep, five of seven free",
    tone: "agreed",
    state: "Agreed",
  },
  {
    what: "Where we're staying",
    detail: "Taormina — 3 nights, Priya booked it",
    tone: "agreed",
    state: "Agreed",
  },
  {
    what: "Jonas's deposit",
    detail: "£420, split 7 ways, logged the day he paid",
    tone: "marine",
    state: "Logged",
  },
  {
    what: "Etna: walk or cable car",
    detail: "Two options, three votes so far",
    tone: "open",
    state: "Still open",
  },
];

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
      <section className="grid gap-10 pt-8 sm:pt-14 lg:grid-cols-[1.05fr_1fr] lg:items-center">
        {/* The cover, verbatim from paper.html's own `.cover` — notebook
            language throughout ("a new book", "someone else's") rather than
            app language, and a handwritten scrawl to sign it off. */}
        <div>
          <p className="typed">A notebook nine people can write in at once</p>
          <h1 className="mt-2.5 max-w-[16ch] font-display text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.025em]">
            Start the trip as <span className="hl">notes</span>. Finish it as a
            plan.
          </h1>
          <p className="mt-4 max-w-[48ch] text-[17.5px] text-ink-soft">
            Everyone scribbles: a place, a price, the week they can't do, the
            pub someone swears by. Waypoint keeps it all on one page and
            quietly turns it into dates, a route and a bill everyone agrees on.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {session?.user ? (
              <ButtonLink href="/trips" variant="primary">
                Open your books
              </ButtonLink>
            ) : (
              <>
                <ButtonLink href="/signup" variant="primary">
                  Open a new book
                </ButtonLink>
                <ButtonLink href="/login" variant="secondary">
                  Read someone else's
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

        {/* Static illustrative mock of the product's own overview tab —
            hand-written sample data, not a live query (see file header). */}
        <Card className="shadow-raised">
          <CardHeader
            title="Sicily, late September"
            hint="7 members · 12 Sep – 19 Sep"
            actions={<Badge tone="agreed">Route agreed</Badge>}
          />
          <div className="space-y-4 p-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-ink-soft">
                Who's in
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
                <p className="text-xs text-ink-soft">Mei is owed £84 across 3 people</p>
              </div>
              <Badge tone="action">Needs settling</Badge>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-rule bg-sheet-2 p-3">
              <Avatar name="Tom Okafor" size={24} />
              <p className="text-sm text-ink-soft">
                <span className="font-medium text-ink">Tom</span> nudged the group
                about picking a hotel in Taormina
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* ==================== THE JOURNEY ================================== */}
      <section className="mt-16">
        <SectionHead
          label="The whole journey, one page"
          title="Six stops between “we should go somewhere” and “that's settled”."
        >
          Nothing here is a wizard. A stop opens when the group is ready for it,
          and a trip that already knows where it's going skips straight to the
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

      {/* ==================== THE GROUP CHAT PROBLEM ====================== */}
      <section className="mt-16">
        <SectionHead
          label="Why bother at all"
          title="A group chat is a terrible place to keep a decision."
        >
          It's a fine place to make one. The problem is finding it again three
          weeks and 400 messages later.
        </SectionHead>

        <div className="mt-7 grid gap-5 md:grid-cols-2 md:gap-6">
          <Card>
            <CardHeader
              title="The chat, week three"
              actions={<Badge tone="action">Nothing decided</Badge>}
            />
            <div className="grid gap-2 px-4 py-3.5">
              {chat.map((m) => (
                <div key={m.said} className="flex items-start gap-2">
                  <Avatar name={m.name} size={22} />
                  <p className="text-[13.5px]">{m.said}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="The same trip, in the book"
              actions={<Stamp>Agreed</Stamp>}
            />
            <div className="px-4 pb-3.5 pt-1.5">
              {settled.map((row) => (
                <div
                  key={row.what}
                  className="flex items-center justify-between gap-3 py-2.5 [&+div]:border-t [&+div]:border-dotted [&+div]:border-rule-strong"
                >
                  <div>
                    <p className="text-sm font-medium">{row.what}</p>
                    <p className="text-[12.5px] text-ink-faint">{row.detail}</p>
                  </div>
                  <Badge tone={row.tone}>{row.state}</Badge>
                </div>
              ))}
            </div>
          </Card>
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

      {!session?.user ? (
        <section className="mt-16 border-t border-rule pt-8 text-center">
          <p className="font-display text-lg font-semibold">
            Got a link from a friend?
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            Open it and you'll see a preview of the trip before you sign up.
          </p>
          <div className="mt-4">
            <Link href="/signup" className="text-sm text-pen underline">
              Or start your own trip
            </Link>
          </div>
        </section>
      ) : null}

      {/* ==================== CONTACT & FEEDBACK ========================== */}
      <section
        id="contact"
        className="mt-16 grid gap-7 lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-10"
      >
        <div>
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
        </div>

        {/*
          The feedback slip, as a torn-off form. Presentation only for now —
          there is no submit target yet, so it doesn't post anywhere and the
          button is disabled rather than silently doing nothing. Wire it to a
          Server Action when the backend for it is designed.
        */}
        <div className="note-tape relative -rotate-[0.4deg] rounded-sm border border-rule bg-sheet-2 p-5 shadow-lifted">
          <p className="typed">Leave a note</p>
          <div className="mt-3 grid gap-3">
            <Field label="Your name">
              <Input type="text" placeholder="Ruth Adeyemi" disabled />
            </Field>
            <Field label="Email">
              <Input type="email" placeholder="ruth@example.com" disabled />
            </Field>
            <Field label="What's this about">
              <Select disabled defaultValue="missing">
                <option value="missing">Something we needed and couldn't find</option>
                <option value="wrong">Something that went wrong</option>
                <option value="how">How my group plans trips</option>
                <option value="other">Something else entirely</option>
              </Select>
            </Field>
            <Field label="Say more">
              <Textarea
                disabled
                placeholder="We were seven people across three countries and the hardest part was…"
              />
            </Field>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-ink-faint">
                Not open yet — email us in the meantime.
              </p>
              <Button variant="primary" type="button" disabled>
                Send it
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Page>
  );
}
