# Mockups

Design artefacts for the marketing homepage and, more recently, for what
Waypoint would be as a phone app. Every file here is a single self-contained
HTML page: no build step, no external requests, opens straight from disk. All
of them reuse the shipped visual language — tokens copied verbatim from
[`globals.css`](../../apps/web/src/app/globals.css). Light only, per ticket 07.

`docs/mockups/` sits outside the pnpm workspace on purpose. Nothing here is a
package and nothing here gains a `package.json`.

## Homepage — the adopted page and its background variants

| File | What it is |
|---|---|
| [`homepage-pinboard.html`](homepage-pinboard.html) | **Superseded.** The journey as a vertical dashed route down the centre, six sticky notes alternating left and right, a pin per stop. This is what the live page followed until G shipped (see *Status* below); its copy survives, its route doesn't. |
| [`homepage-pinboard-atlas.html`](homepage-pinboard-atlas.html) | Same structure and copy, verbatim. Only the `.page` background differs: an inline SVG vintage nautical chart behind the sheet. |
| [`homepage-pinboard-trailmap.html`](homepage-pinboard-trailmap.html) | Same again, with a hand-drawn explorer trail map behind the sheet. |
| [`homepage-pinboard-map.html`](homepage-pinboard-map.html) | Same again, but the hero card's plain-text Route row becomes a mock embedded map — answering "what if a map provider were wired in". The plain-text version stays the fallback, per ticket 11. |

The three variants are unadopted artefacts. Two earlier siblings,
`homepage-trail.html` and `homepage-margin.html`, are referenced by their
headers but no longer exist on disk.

### What the pinboard page changed from its mockup, while it was live

- **The stops were staggered, not diagonal.** Each note was wider than its half
  of the page and overhung the centre, and the vertical gap between stops was
  small — so stop 02 sat *alongside* stop 01 rather than in the next row down,
  and neither side of the page was left blank.
- **The route curved.** Each leg bulged towards the side of the row the note
  *wasn't* on, so the line walked out into the blank paper and back behind the
  next note. An SVG per leg rather than a CSS border, for the reason in the
  geometry note below; the pins stayed HTML.

Both are gone from `page.tsx` with the coupon book (below); the `.route*`,
`.fan*` and `.hero-canvas` rules went out of `globals.css` at the same time.
The "leave a note" form was already disabled and had gone before that — there
is still no submit target for it.

## Homepage — hero explorations

Three answers to one piece of feedback: the homepage has no unique selling
point that lands immediately. The headline is the part that works and is kept
verbatim in all three; what changes is the 40-word lede (cut to one line or
removed entirely) and what proves the claim. All three also add a **post-it
canvas** behind the hero, so the top of the page isn't flat cream.

| File | What it argues | Where the proof sits |
|---|---|---|
| [`homepage-hero-a-scatter.html`](homepage-hero-a-scatter.html) | Show it, don't say it | Loose post-its funnel down into one settled plan card, with the word "becomes" between them |
| [`homepage-hero-b-beforeafter.html`](homepage-hero-b-beforeafter.html) | The same trip, twice | Headline full-width; below it a fan of six scrawled notes on the left, the settled sheet on the right, an arrow between |
| [`homepage-hero-c-outcomes.html`](homepage-hero-c-outcomes.html) | Say it plainly | A three-up outcomes strip directly under the buttons — a week everyone can do · a route no one's arguing with · a bill that's settled |

Each carries a cut-down three-stop version of the journey section below the
hero, so the hero can be judged in context — they are not full replacement
pages, and the copy claims nothing the product doesn't already do.

### Round two — D, E, F, and the page that came out of them

A later round, asked for once B had been live for a while: same notebook, less
post-it. Three hero-only explorations — top bar plus hero, nothing below the
fold, because the journey section wasn't what was in question. **The three
hero files were not kept**; what they argued is recorded here because the
choice between them is the part worth remembering:

| Hero | What it argued | The object |
|---|---|---|
| D | The trip as a document you're holding | A travel pass tucked into the notebook: headline on the body, CTAs where the gate block goes, the trip's state on a real tear-off stub |
| E | Before/after, but as one object | The notebook open at a two-page spread — the arguing written on the left page, the settled plan on the right, the fold *is* the fortnight |
| F | Completeness, not transformation | A card index on a wire ring: one ruled index card per decision, tabs across the top, the Dates card face-up and answered |

**D was picked**, and [`homepage-g-boardingpass.html`](homepage-g-boardingpass.html)
is the full page built out of it — the file that survives the round. It keeps
D's hero verbatim and carries the travel-document idea the whole way down, so
the page reads as a wallet of documents for one trip:

| Section | The object |
|---|---|
| Hero | The pass, unchanged from D |
| Who it's for | The three group shapes as **luggage tags** on strings, punched and eyeletted, each hanging at its own angle |
| The journey | The six stops as one **fold-out coupon book** — a perforated strip, each coupon with a counterfoil down the left carrying the stop number, the tab name and that tab's own wash. This replaces the live page's wandering dashed route: a route suits a pinboard, a strip you tear along suits a document |
| Closing | The **entry stamp** — a customs impression for the invited-friend line, one last CTA beside it, and the passport MRZ strip doubling as the footer rule |

### Round three — H and I

Two more were tried once G had been seen: **H**, which pushed G's language
further (the pass opened out, a split-flap state board, visa stamps for the
group shapes, the six stops as a horizontal concertina), and **I**, the control
group — flat surfaces, sans throughout, no texture or tilt or handwriting, the
hero showing the product rather than a metaphor for it.

Neither file was kept, and the reason I was dropped is worth writing down: it
kept the palette token-for-token and still read as a different company. Its
cost was the whole visual language — no `--hand`, no `--marginalia`, no
`--serif` body face, and not one existing component (the sheet, the folder
tabs, the trail) surviving inside it. Adopting it would have meant rewriting
[`../visual-language.md`](../visual-language.md), not editing it.

### J — G, annotated

[`homepage-j-boardingpass-postits.html`](homepage-j-boardingpass-postits.html)
is G with four post-its stuck **onto** the documents — a reminder taped to the
pass, a question pinned to the luggage tags, a note flagging one coupon, a
nudge by the entry stamp. Same four sections, same copy, same structure; the
notes are the only change.

Deliberately not the live hero's treatment (a post-it canvas *behind* the
copy): that suits a flat hero, whereas the pass, tags and coupon book are
already physical objects, so a note sits on one of them, casts a small shadow
and is a few degrees off true. Every note carries a handwritten line — none is
decorative colour.

J is unadopted. G is not — see below.

### Status: G is adopted

**`homepage-g-boardingpass.html` has shipped** as the whole of
[`apps/web/src/app/page.tsx`](../../apps/web/src/app/page.tsx), all four
sections of it. It replaced two things at once: B's before/after hero and the
pinboard's dashed route. The reason for taking both together is the reason G
exists — the page was a hero made of post-its followed by marketing sections
made of paper, and reading as two products. Every surface is now one object:
the pass, the tags, the coupon book, the entry stamp.

Deliberate departures from the mockup:

- **The documents sit on the app's own ruled sheet**, not on a full-bleed
  page. So every surface moves one step up the paper scale — a document body
  is `--sheet-2`, a stub or an untinted counterfoil is `--sheet-3`, and every
  punched hole is `--sheet`, because what shows through a hole is the sheet the
  document is lying on. The mockup punched to `--paper`, which is the page
  *behind* the sheet here and would have read as a hole through both.
- **The MRZ strip bleeds to the sheet's edges** rather than being a full-width
  footer band, and its left inset cancels the red margin's gutter (`pl-[38px]`
  / `sm:pl-[76px]` on `Page`) rather than the plain padding — they differ.
- **The CTAs are wired.** `/explore` sits behind `requireUser`, so the
  signed-out secondary links to `/login?redirect=%2Fexplore` — sign in and you
  land on the thing the button promised. The entry-stamp section only renders
  signed-out; a signed-in visitor gets a link back to their trips instead.
- **Stop 06's counterfoil takes the neutral wash.** The counterfoil tint is
  that tab's own colour, and there is no "After" tab in the six — so it
  borrows nobody's. The tab's name is written on every counterfoil regardless,
  so the colour is never carrying the meaning alone.

`homepage-hero-a-scatter.html`, `homepage-hero-b-beforeafter.html` and
`homepage-hero-c-outcomes.html` are all unadopted artefacts now.

### The token change that shipped with it

**The post-it stock is gone.** The five `--note-*` pairs (`--note-yellow`,
`-coral`, `-mint`, `-sky`, `-lilac`, each with a `-edge` for the turned corner)
were added for B's hero and were only ever used there; the travel document has
no post-its on it, so they came out of `globals.css` with the `.fan`,
`.hero-canvas` and `.route*` rules. The rule they were introduced *under*
still stands for anything that replaces them: the `--who-*` pencil-crayon
washes are reserved for people and must not be reused for decoration.

The other change of B's round, **the legible handwriting stack**, stays — it
was never about the hero. `--hand` used to lead with script faces and the
marginalia was unreadable at 15px on a phone:

```css
--hand: "Bradley Hand", "Chalkboard SE", "Marker Felt", "Segoe Print",
  "Comic Sans MS", ui-rounded, cursive;
```

`"Segoe Script"` is gone and the rounder print hands lead. `.hand` carries the
other half of the fix — `font-size: 1.06em; letter-spacing: 0.012em;
line-height: 1.5` — because handwriting sits visually smaller than the serif at
the same px. The rule that `--hand` is for accents and marginalia only, never
for data, is unaffected: on the live page it writes the pass's marginalia and
each coupon's scribble, and nothing else.

## Phone app

Everything Waypoint has to date is responsive desktop-first web. These two ask
a different question: if it were an installed app, what does it look like?

| File | Screens |
|---|---|
| [`app-phone-home.html`](app-phone-home.html) | Trip list with "what needs you" pinned above it · the same list scrolled to past trips · the new-trip bottom sheet |
| [`app-phone-overview.html`](app-phone-overview.html) | The trip overview's trail and roster · scrolled to Unresolved · the Money tab, to show the tab strip scrolled |

**Exploratory. No native app is scheduled**, and push notification is
explicitly out of scope for v1 — see [`../../CLAUDE.md`](../../CLAUDE.md).
These exist to test whether the paper language and the group's data survive one
column and a thumb, not to propose a build.

Both files draw 390×844 frames — iPhone 14/15 logical size — side by side on
the paper background, so several states can be compared at once. The app-shell
conventions they share:

- A drawn status bar, a 44px-minimum app bar, a bottom tab bar of the four root
  destinations that already exist in `apps/web` (`/trips`, `/explore`,
  `/friends`, `/profile`), and a home-indicator bar in the safe area.
- Home is the **trip list**, not the marketing page. An installed app opens
  into your own stuff.
- The six trip tabs (Overview · Ideas · Dates · Route · Days · Money) become a
  horizontally scrolling segmented control — the same treatment `.scroll-x-bare`
  gives them on mobile web, with the active tab attached to the sheet.
- The trail stands up. Five stations across 358px stack their captions; down
  the page each gets a full line. States, key and wording are
  [`trip-trail.tsx`](../../apps/web/src/components/trip-trail.tsx)'s, unchanged.
- Unresolved is tinted by one question only — is this mine to do? — in the
  trail's blue. Red stays reserved for destructive controls.
- Every figure is typed, tabular and to the penny. Money is a ledger, never a
  payment rail.

## Wayfinder prototypes

Throwaway artefacts made to be reacted to and then dropped — not proposals, not
production code. Each one is a single page showing three directions side by
side. Both have since been decided; the pages stay as the record of what the
other two directions were and why they lost.

| File | Ticket | What it asks |
|---|---|---|
| [`overview-hero-stage-abc.html`](overview-hero-stage-abc.html) | [#89](https://github.com/AidanInceer/Waypoint/issues/89) | Three ways to say where a trip is up to on the Overview hero. **B shipped**: the trip's name is the headline, the stage is a badge beside it, the caveat is one plain line — and the duplicate name/dates/badges came off the layout header. |
| [`money-split-abc.html`](money-split-abc.html) | [#85](https://github.com/AidanInceer/Waypoint/issues/85) | Three directions for splitting money, model and UI. **B shipped, with A's exclusion gesture**: one shares model with pinned amounts, and taking someone out of a cost is a tap rather than a zero. |

## Days as a calendar

Four directions for what the Days tab becomes if the day cards give way to
something calendar-shaped. All four carry the same right-hand pane on purpose —
the selected event (facts, its own note, its thread) and a trip-wide
notes-and-links pad — so the comparison is about the calendar and nothing else.
All four are interactive; none is wired to a Server Action.

| File | What it asks |
|---|---|
| [`days-calendar-v2.html`](days-calendar-v2.html) | **Shipped** ([#103](https://github.com/AidanInceer/Waypoint/issues/103)) — A, second pass, and the source the live Days tab was built from. Everything below plus the three things A got wrong: a day column now has a floor and the week scrolls sideways under a pinned clock (handing over to Day view, with the reason said out loud, when even that stops working); adding snaps to the quarter hour with a chip naming it before you commit; and an event drags to another time *and another day* in one gesture, with its bottom edge as a resize handle. Keyboard equivalents throughout — ↑/↓ nudge 15 minutes, shift+←/→ move a day. |
| [`days-calendar.html`](days-calendar.html) | A, first pass. The Google-Calendar shape: hour rows, events as tall as they are long, Day/Week switch, ticket 90's category filter as chips, click-a-slot to add, overlaps splitting the column rather than being labelled. Superseded by v2; kept as the record of what the first cut looked like. |
| [`days-timeline.html`](days-timeline.html) | Turn it on its side — time left-to-right, one row per day, the whole trip on one screen with a zoom slider instead of a view switch. Travel days read well; short events go to slivers and overlaps make the rows uneven. |
| [`days-agenda.html`](days-agenda.html) | Keep the list, add a time rail and — the point of it — draw the *gaps* as their own clickable rows ("4h 30m free — nothing planned between 14:00 and 16:00"). Duration becomes a number rather than a size. Week collapses each day to a line of pips. |
| [`days-board.html`](days-board.html) | No clock at all: columns are morning / afternoon / evening and a time is an optional detail on a card, because a group planning three months out does not know the kayaks are at 15:30. Drag between cells. Timed travel days read worse here than anywhere else. |

What the set put up for argument, and how the shipped page answered it. All-day
and untimed events keep a **strip above the grid** — making a time mandatory
would have meant inventing one for every row that hasn't got one. Overlaps
**are** drawn side by side, in lanes derived from the times rather than from
anything stored, and the word "Overlaps" is still on the block, because colour
and geometry are never the only signal. A time is still **not required**. The
trip-wide pad shipped as a **thread**, not a free-text box and not a link list:
the `note` table already has a `trip` scope, and a thread is a thing people
answer each other in, where the box nobody could define is exactly what per-day
notes already were.

## Geometry note

Every route is drawn per-stop (each stop owns its own leg of the dashed line
and its own pin) rather than as one absolutely-positioned overlay, and in CSS
rather than as a stretched SVG. Two failure modes that avoids: a long note
pushing the line out of alignment, and a `viewBox` scaled to the container's
width squashing the round pins into ellipses.

This applied to the homepage's route until G replaced it, and still applies to
the pinboard files and to any route drawn down a page. The coupon book needs
none of it: a perforation is a border between two grid rows, and its punches
are pseudo-elements on the row itself, so nothing has to be measured against
anything.
