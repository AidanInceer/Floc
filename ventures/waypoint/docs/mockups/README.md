# Homepage mockups

Three expansions of the marketing homepage
([`apps/web/src/app/page.tsx`](../../apps/web/src/app/page.tsx)). All three
reuse the shipped visual language exactly — tokens copied verbatim from
[`globals.css`](../../apps/web/src/app/globals.css), the hero section copied
verbatim from the live page. Only the content *below* the hero differs.

Each is a single self-contained HTML file: no build step, no external requests,
opens straight from disk. Light only, per ticket 07.

| File | Route treatment | Length | Best for |
|---|---|---|---|
| [`homepage-trail.html`](homepage-trail.html) | Horizontal dashed route across the page, five sticky notes hanging above it on dashed stems, a pin per stop | Shortest — one screen of journey | Skim-readers; the closest to a conventional landing page |
| [`homepage-pinboard.html`](homepage-pinboard.html) | Vertical dashed route down the centre, six sticky notes alternating left and right, a pin per stop | Medium | The "scroll and it unfolds" read; room for a worked example per stop |
| [`homepage-margin.html`](homepage-margin.html) | Vertical dashed route down the left gutter, alongside the sheet's own red margin; full-width notes to the right | Longest | Making the case properly — each stop pairs copy with a fragment of the real UI |

## What all three share

- The hero, unchanged from production.
- A sticky-note journey below the hero, on a dashed map route with pin stops.
  Notes are deliberately **not** `Card`s — square corners, a lifted shadow, a
  tape tab and a slight rotation — so the journey reads as something stuck to
  the page rather than as more panels of the app.
- A contact + feedback block at the bottom: email, bug report, roadmap link,
  and a feedback form.

## Geometry note

Every route is drawn per-stop (each stop owns its own leg of the dashed line
and its own pin) rather than as one absolutely-positioned overlay, and in CSS
rather than as a stretched SVG. Two failure modes that avoids: a long note
pushing the line out of alignment, and a `viewBox` scaled to the container's
width squashing the round pins into ellipses.

## Content differences

| Section | trail | pinboard | margin |
|---|---|---|---|
| Journey stops | 5 | 6 (adds "after the trip") | 5, each with a UI fragment |
| "On the day" strip | ✓ | — | — |
| Group-chat before/after | — | ✓ | — |
| Who it's for | — | ✓ | — |
| What it costs | — | — | ✓ |
| Objections / what it isn't | ✓ | — | ✓ |

## Status

**`homepage-pinboard.html` has been adopted** — it is now
[`apps/web/src/app/page.tsx`](../../apps/web/src/app/page.tsx), with two
deliberate departures from the mockup:

- **The stops are staggered, not diagonal.** Each note is wider than its half
  of the page and overhangs the centre, and the vertical gap between stops is
  small — so stop 02 sits *alongside* stop 01 rather than in the next row down,
  and neither side of the page is left blank.
- **The route curves.** Each leg bulges towards the side of the row the note
  *isn't* on, so the line walks out into the blank paper and back behind the
  next note. It's an SVG per leg rather than a CSS border, for the reasons in
  the geometry note below; the pins stay HTML.

The "leave a note" form is rendered but disabled — there is no submit target
yet. Wire it to a Server Action when its backend is designed.

`homepage-trail.html` and `homepage-margin.html` remain unadopted design
artefacts. The copy claims nothing the product doesn't already do, with one
exception: the pricing block in `homepage-margin.html` is explicitly framed as
a direction, not a price list. See [`../monetisation.md`](../monetisation.md).
