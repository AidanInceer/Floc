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
| [`homepage-pinboard.html`](homepage-pinboard.html) | **Adopted.** The journey as a vertical dashed route down the centre, six sticky notes alternating left and right, a pin per stop. This is what [`apps/web/src/app/page.tsx`](../../apps/web/src/app/page.tsx) follows. |
| [`homepage-pinboard-atlas.html`](homepage-pinboard-atlas.html) | Same structure and copy, verbatim. Only the `.page` background differs: an inline SVG vintage nautical chart behind the sheet. |
| [`homepage-pinboard-trailmap.html`](homepage-pinboard-trailmap.html) | Same again, with a hand-drawn explorer trail map behind the sheet. |
| [`homepage-pinboard-map.html`](homepage-pinboard-map.html) | Same again, but the hero card's plain-text Route row becomes a mock embedded map — answering "what if a map provider were wired in". The plain-text version stays the fallback, per ticket 11. |

The three variants are unadopted artefacts. Two earlier siblings,
`homepage-trail.html` and `homepage-margin.html`, are referenced by their
headers but no longer exist on disk.

### What the adopted page changed from its mockup

- **The stops are staggered, not diagonal.** Each note is wider than its half
  of the page and overhangs the centre, and the vertical gap between stops is
  small — so stop 02 sits *alongside* stop 01 rather than in the next row down,
  and neither side of the page is left blank.
- **The route curves.** Each leg bulges towards the side of the row the note
  *isn't* on, so the line walks out into the blank paper and back behind the
  next note. It's an SVG per leg rather than a CSS border, for the reason in
  the geometry note below; the pins stay HTML.

The "leave a note" form is rendered but disabled — there is no submit target
yet. Wire it to a Server Action when its backend is designed.

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

### Status: B is adopted

**`homepage-hero-b-beforeafter.html` has shipped** as the hero of
[`apps/web/src/app/page.tsx`](../../apps/web/src/app/page.tsx). Everything
below the hero is unchanged and still follows `homepage-pinboard.html`. Three
deliberate departures from the mockup:

- **The post-it canvas is a grid cell, not a layer behind the copy.** As an
  absolutely-positioned overlay it put coloured paper under the H1 and the
  buttons, where it fought the red and green highlighter strokes and made the
  headline hard to read. As its own column beside the headline it cannot reach
  the copy at any width; on a phone it drops below the buttons rather than
  behind them. It bleeds off the right edge only, which the sheet's
  `overflow: hidden` clips.
- **The connector points right, not down**, in the direction the argument
  reads: a dashed run with a head, and the handwritten label above it.
- **The copy changed.** The eyebrow is "Group trip planning, sorted"; the CTAs
  are "Plan your next trip now" and "Get inspired". `/explore` sits behind
  `requireUser`, so the signed-out secondary links to
  `/login?redirect=%2Fexplore` — sign in and you land on the thing the button
  promised.

`homepage-hero-a-scatter.html` and `homepage-hero-c-outcomes.html` remain
unadopted artefacts.

### Two token changes that shipped with it

1. **Post-it stock.** Five new `--note-*` pairs (`--note-yellow`, `-coral`,
   `-mint`, `-sky`, `-lilac`, each with a `-edge` one step darker for the
   turned corner). Brighter than the `--who-*` pencil-crayon washes, which are
   reserved for people and must not be reused for decoration.

2. **A legible handwriting stack.** `--hand` used to lead with script faces,
   and the marginalia — "— started 14 Feb, still arguing about Croatia" — was
   unreadable at 15px on a phone. Now:

   ```css
   --hand: "Bradley Hand", "Chalkboard SE", "Marker Felt", "Segoe Print",
     "Comic Sans MS", ui-rounded, cursive;
   ```

   `"Segoe Script"` is gone and the rounder print hands lead. `.hand` carries
   the other half of the fix — `font-size: 1.06em; letter-spacing: 0.012em;
   line-height: 1.5`, rising to `1.12em` below `sm:` — because handwriting sits
   visually smaller than the serif at the same px. The rule that `--hand` is
   for accents and marginalia only, never for data, is unaffected.

### The post-it canvas

Hero band only; the rest of the page stays cream.

One inline `<svg>`, `aria-hidden`, `pointer-events: none`, carrying **no text
at all** — every word a visitor needs to read is in the foreground fan. The
first pass scattered scrawled notes across the full width of the band at 85%
opacity and it fought the headline; what shipped is a contained cell at 55%,
faded out along its inner edge so it doesn't hard-stop against the copy.
Variants A and C keep the overlay form at a much lower opacity, with the notes
kept clear of the text block.

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
adopted, and deliberately not production code. Each one is a single page
showing three directions side by side.

| File | Ticket | What it asks |
|---|---|---|
| [`overview-hero-stage-abc.html`](overview-hero-stage-abc.html) | [#89](https://github.com/AidanInceer/Waypoint/issues/89) | Three ways to say where a trip is up to on the Overview hero, once "Up to" and "Ended — still editable if anything's unfinished" are admitted to be clutter. Each drawn mid-plan and ended. |
| [`money-split-abc.html`](money-split-abc.html) | [#85](https://github.com/AidanInceer/Waypoint/issues/85) | Three directions for splitting money — the model underneath and the UI over it: even-by-default with exclusions, one shares model with self-balancing amounts, and an itemised receipt. |

## Geometry note

Every route is drawn per-stop (each stop owns its own leg of the dashed line
and its own pin) rather than as one absolutely-positioned overlay, and in CSS
rather than as a stretched SVG. Two failure modes that avoids: a long note
pushing the line out of alignment, and a `viewBox` scaled to the container's
width squashing the round pins into ellipses.

The post-it canvas is the deliberate exception — it *is* one stretched SVG,
because nothing in it has to align with anything in the content, and
`preserveAspectRatio="xMidYMin slice"` keeps the notes square while the band
resizes.
