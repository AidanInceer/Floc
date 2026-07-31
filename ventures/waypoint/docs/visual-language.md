# Waypoint v1 — visual language

Resolves [ticket 11](../../../.scratch/waypoint-v1/issues/11-visual-language-for-v1.md).
The living version of this is the code: tokens in
[`apps/web/src/app/globals.css`](../apps/web/src/app/globals.css), components in
[`apps/web/src/components/ui.tsx`](../apps/web/src/components/ui.tsx).

## The winner, and what it borrows

**`wireframe/paper.html`** wins — a shared travel journal: ruled sheets, a
serif that reads like a book, a red margin down the gutter, tape holding
things down, and an ink stamp for anything the group has actually decided.
Colour is ink and highlighter, nothing more. (An earlier pass on this ticket
picked `index.html`'s sand/marine direction instead; revisited on request —
`paper.html` reads as *a shared document* even more directly, and its own
mono-figures discipline solves the legibility concern that ruled the first
pass out.)

Borrowed from the runners-up:

| From | What |
|---|---|
| `transit` | The three-state status semantics — **agreed / open / needs action** — applied identically on every tab instead of each page inventing its own colour meaning. |
| `index` | The token discipline: every colour, radius and shadow is a CSS variable: no component holds a hex value. |

Rejected, with reasons: **`island`** and **`glossy`** (both read as
consumer-social — wrong tone for a planning tool), **`atlas`** and **`dusk`**
(the ruled-paper metaphor is distinctive enough on its own; layering another
variant's texture on top would dilute it).

## The legibility rule

Paper's own discipline, kept as a hard rule rather than a suggestion:

- `--serif` for prose and headings.
- `--type` (a monospace, tabular-figures) for **every** figure, date and
  label — the `.nums`/`font-mono` classes. All money.
- `--hand` for accents and marginalia only. Never for data, never for
  anything a user has to read carefully.

This is what makes the metaphor survive a money ledger: amounts, dates and
balances are always typed, never handwritten.

`--hand` is a **print** hand, not a script one. The stack originally led with
`"Segoe Print"` and carried `"Segoe Script"`, and the marginalia was unreadable
at 15px on a phone — the rounder faces now lead and the script one is gone.
`.hand` also carries its own size and tracking (`1.06em`, rising to `1.12em`
below `sm:`), because a handwriting face sits visually smaller than the serif
at the same px. The two go together: swapping the stack back without the sizing
rule reintroduces half the problem.

## Light only

There is **no dark mode**, and that's a decision rather than an omission: the
whole metaphor is ink on paper, and a dark notebook is a different product.
So there is no dark palette in `globals.css`, no `data-theme` attribute, no
theme picker on `/settings` and no `theme` column on `user_profile`. A dark OS
preference is ignored. Don't reintroduce any of it without reopening ticket 07.

## Tokens

Colour, radii, shadow and type tokens are defined once in `globals.css`, on
`:root`. `@theme inline` re-exports them as Tailwind utilities (`bg-sheet`,
`text-ink-soft`, `border-rule`, `text-pen`, …) so no component ever hardcodes
a hex value.

- **Surfaces** — `paper` (page background), `sheet`/`sheet-2`/`sheet-3` (the
  page-as-journal-entry and its nested/hover states), separated by
  `rule`/`rule-2` hairlines. Cards do not nest inside cards; a rule does the
  job of a second card.
- **Ink** — `ink`, `ink-2` (soft), `ink-3` (faint). Three levels, no more.
- **Accent** — `pen` (biro blue) for anything actionable, navigational, or a
  link — paper.html's own name for it, kept.
- **Status** — `green`/agreed, `highlight`/open (a highlighter wash — pairs
  with `highlight-ink` for text, since raw ink is too dark to read on
  yellow), `red`/action. Each has a `-soft` background pair. Never colour
  alone: every status also carries a word.
- **Texture** — `line` (the faint ruled line), `margin-line` (the red
  margin), `tape`. Decorative only, `aria-hidden`, never load-bearing for
  content.
- **People** — `who-1`…`who-8` plus an ink pair each: one pastel per member,
  as paper.html's own coloured initial discs. Assigned by roster position in
  `lib/who.ts` (see People below), so this is the one place a colour is
  picked per-person rather than per-meaning.
- **Post-it stock** — `note-yellow` / `-coral` / `-mint` / `-sky` / `-lilac`,
  each with a `-edge` one step darker for the turned corner. The landing
  page's hero only. Brighter than the `who-*` pastels deliberately, and they
  are **not** interchangeable with them: a `who-*` wash means a person, so
  decorating with one would make a sticky note look like a member.
- **Radii** — 3 / 5 / 6px. Paper is cut, not moulded, so these stay far below
  the previous direction's 6/10/16px — but the first pass at 2/3/4px read as
  *sharp* rather than as cut, so they were softened on request. `Card`,
  buttons and form fields sit on `md` (5px), the sheet and the folder tabs on
  `lg` (6px, matching paper.html's own `4px 4px 0 0` tabs at the new scale),
  and `Badge` on `sm`.
- **Motion** — colour transitions only, and nothing at all under
  `prefers-reduced-motion`.

## Density and tone

A planning tool that should feel like a shared notebook, not a social feed
and not a spreadsheet either. Concretely: tabular monospace figures, a red
margin and ruled lines on every page (once, at the page level — see
Mechanics below), restrained elevation, sentence-case copy that says what
happened ("Priya pays Tom £42.50") rather than app-speak, and empty states
that read as an invitation rather than an error.

## Mechanics

The paper metaphor is mechanics, not just a palette swap — this is what
actually carries the direction:

- **The page is the sheet.** `Page` in `components/ui.tsx` wraps every
  screen's content in one ruled-paper container: `.sheet-ruled` (a repeating
  horizontal-line background), `.sheet-margin` (the red gutter line, at
  22px on mobile / 46px from `sm:` up — content padding clears it on both),
  and a decorative `.tape` strip in the top-left corner. This happens **once
  per screen**, not per card — ruled lines on every nested card would read
  as clutter, not more of the same journal.
- **Ruled lines, margin, and tape needed three different DOM hooks.** All
  three are decorative overlays on the same container; `::before` and
  `::after` are the only two pseudo-elements a single element gets, so tape
  is a real `<span aria-hidden>` rather than a third pseudo-element — three
  classes all targeting `::before` on one node silently clobber each other
  (whichever is last in the stylesheet wins outright), which is exactly the
  bug this surfaced on first render.
- **The decoration is explicitly pushed *under* the content.** An
  absolutely-positioned pseudo-element is a positioned descendant, so by CSS
  paint order it lands above its container's ordinary children — which meant
  the ruled lines and the red margin drew *over* every card, button and
  heading. All three decorations carry `z-index: 0` and `Page` wraps its
  children in `.sheet-content` (`position: relative; z-index: 1`). Both
  halves are needed; dropping either brings the lines back to the front.
- **`Card` is a plain note-card**, not more paper: a border and `sheet-2`
  fill, no ruled lines, no shadow. The page supplies the texture; cards
  supply structure.
- **`Badge` is paper.html's `.mark`** — mono, uppercase, bordered, a soft
  tone fill per status. **`Stamp`** is new: for a state the group has
  *decided*, not just a status — a trip that's ended, an expense split
  that's settled — rendered rotated and bordered like it was actually
  stamped. Reserved for genuinely decided states; everything else stays a
  `Badge`.
- **Buttons are biro, not chrome**: mono, uppercase, tight tracking, a solid
  pen-blue fill for primary and an outline for everything else. `filter:
  brightness()` stands in for a hover-darken, since a pen has no separate
  "hover ink".
- **Trip tabs are folder tabs, actually attached to the sheet.** They sit on
  the page background (`bg-paper`, not `bg-sheet`) so the active tab's `sheet`
  fill reads as "this one's open", and three things make the join real rather
  than implied: the nav's `-mb-0.5` drops it onto the sheet's top border, the
  active tab's bottom border is painted `sheet` so the two shapes share an
  opening instead of stacking two lines, and an inactive tab sits a pixel
  lower (paper.html's `top: 1px`) so it reads as still tucked behind. `Page`
  takes a `flush` prop for this — `pt-0`, a square top edge, and no tape,
  since tape would hang over exactly where the tabs are. **Every
  `trip/[id]/*` page must pass `wide flush`**: the tabs are only aligned
  because the nav's container matches `Page wide`'s width and padding, so a
  narrow tab page would visibly miss.
  - The strip scrolls sideways via `.scroll-x-bare`, which hides the
    scrollbars outright. Not cosmetic: `overflow-x: auto` forces the *other*
    axis to `auto` too, and the 1px the raised inactive tabs sit below the
    strip was enough to summon a vertical scrollbar with arrows at the end of
    the tab row.
  - Each tab carries a `useLinkStatus` pending ellipsis, and
    `trip/[id]/loading.tsx` shows a blank ruled page underneath while the
    tab's own content loads — every tab is a server render over the database,
    so there is always some wait to account for.
- **A thread is a disclosure, not a feed.** `NoteThread` is one component for
  every surface with a discussion (ideas, day events), oldest-first, collapsed
  behind a summary that carries the count ("3 notes") — twenty ideas with every
  thread expanded is unreadable. It renders `open` where you've already clicked
  into something, which is how the Days tab uses it.
- **A day event opens up.** Collapsed it's one line, because the *sequence* is
  what you read at a glance; open it holds its note, its flight deep link, its
  thread and its controls. Those controls have to live in the panel rather than
  the summary row — a button inside a `<summary>` toggles the disclosure as
  well as firing, so every one of them would have collapsed the thing it acted
  on.

## People

Everyone gets **their own pastel disc**, not one shared accent — with nine
people writing in the same notebook you have to tell handwriting apart at a
glance. Eight washes (`--who-1`…`--who-8`), each with a darker ink pair so the
initials stay legible.

Two ways the colour is picked, in `lib/who.ts`:

- **`seatTone`, by roster position** — the normal case. `listMembers` stamps
  every `TripMember` with a `tone` as it loads them, so within one trip nobody
  shares a colour and a member looks the same on every tab. Anything drawing a
  member's avatar passes `tone` through.
- **`whoTone`, by hashed display name** — the fallback where there is no
  roster: the signed-in user in the app chrome, a friend, the landing mock, a
  former member on an old expense. Occasional clashes are accepted; colour is
  a recognition aid and never the only way to tell two people apart (the
  initials and the `title` still do that).

## Component inventory

Hand-rolled, not shadcn/ui. v1 needs about a dozen primitives, and owning them
keeps the density undiluted; a component registry would have to be re-skinned
anyway.

`AvailabilityCalendar` (client) is the one component with real interaction in
it: a month grid you paint free days onto by clicking or dragging, with a
**Mine / Everyone** switch onto the same grid as a counted heatmap. Two
decisions worth keeping: nothing is written until you press save (one action per
editing session, not one per day — painting a fortnight would otherwise be
fourteen round trips), and a drag paints the whole span from its anchor rather
than the cell under the pointer, because a fast drag doesn't fire
`pointerenter` on every cell it crosses and leaves holes mid-week.

Server components in `components/ui.tsx`: `Page`, `PageHeader`, `Card`,
`CardHeader`, `Stack`, `Rule`, `Button`, `ButtonLink`, `Badge`, `Stamp`,
`EmptyState`, `LockedNotice`, `Avatar`, `AvatarRow`, `Field`, `Input`,
`Textarea`, `Select`, `ErrorText`. Avatar colouring lives in `lib/who.ts`
rather than beside `Avatar`, because `lib/access.ts` needs it too.

Client components in `components/client-ui.tsx`: `ActionForm` (surfaces a
server action's `{ error }` return without a page reload), `SubmitButton`
(pending state from `useFormStatus`), `Sheet` (a native `<dialog>` — bottom
sheet on mobile, centred panel on desktop), `ConfirmSubmit`, `CopyLink`,
`Segmented`.

Two client components sit outside those two files because they belong to one
surface: `StopSpine` (Route's stop list) and `LegTransportPicker` (the travel
mode on a leg), both from ticket 82.

## Lists whose order is the point

Route's stop list is drawn as a **spine**: the dates own a rail down the left,
and order and direction are one inked line running top to bottom through
numbered nodes (`components/stop-spine.tsx`). It replaced a stack of cards that
answered "when" and "in what order" only in words — chosen by the user from
three prototype directions on the real page, over boarding-pass stubs and a
gantt of date bands.

Two rules came out of it, and they generalise:

- **The mark that draws the order is the mark you grab.** The numbered node is
  the drag grip; a separate grip hovering above it reads as a second, competing
  handle. `↑`/`↓` sit under the node as the keyboard path.
- **A server-rendered row can't be handed a render prop.** A function child
  doesn't cross the server/client boundary (same constraint as `Sheet`), so a
  client list that needs to draw *around* server content takes the content as
  plain nodes — `body`, `leg` — rather than calling back into it. `DragList`,
  whose chrome sits above each item, stays the shape for everything else.

## Maps and pictures

Both arrived with v0.2 ticket 08 and are house treatments — don't invent a
second of either.

**A map is CSS over plain OpenStreetMap tiles.** A filter stack on the tile
pane (`sepia saturate contrast brightness hue-rotate`) knocks OSM's cartoon
palette back to ink-on-cream; a multiply-blended ruled wash and an inset
vignette then sit it on the page's own paper. The whole look costs no second
tile provider, no account and no extra request — which is the point, and what
keeps ticket 15's "free for the MVP" decision intact. `RouteMap` (Leaflet,
draggable and zoomable but with the **scroll wheel always off**, so a
full-width map never traps the page scroll) and `StaticMap`
(plain `<img>` tile mosaics, no library) share it. OSM's attribution must be
visible wherever tiles are — Leaflet's own control counts; a page of still
maps prints it once.

**A picture is NOT framed as a postage stamp.** A perforated stamp frame was
built for the Explore thumbnails and **rejected on sight, 2026-07-27** — don't
propose it again. A picture sits in the same plain ruled frame the maps use.
(The geometry, if it is ever wanted for something else: the outline has to be a
JS-built `clip-path` polygon, because CSS mask layers union and cannot be
clipped to a run, so a mask always refills the corners as solid squares. And
the lift has to be `filter: drop-shadow`, never `box-shadow`, which on a
clipped box still draws the un-clipped rectangle.)

**A price is a luggage tag** (`.price-tag`) — notched left end, punched hole,
a degree of tilt — not a line of prose. The tag carries the **figure only**;
"from … each" was tried on it and read as clutter, so the qualification lives
in the tag's `title` and its screen-reader label instead.

## The screen that carries the character

`/trip/[id]/overview` — it holds the summary, the unresolved list and the
nudge panel at once, so it is where the journal tone, the ruled sheet and the
three-state status semantics have to work hardest. The rest of the app is
derived from it.
