---
paths:
  - "floc/apps/web/src/components/**"
  - "floc/apps/web/src/app/**/*.tsx"
  - "floc/apps/web/src/app/**/*.css"
  - "floc/apps/mobile/src/components/**"
  - "floc/apps/mobile/app/**"
  - "floc/packages/floc-editor/src/**"
  - "floc/packages/floc-globe/src/**"
  - "floc/wireframe/**"
  - "scripts/wireframe/**"
  - "floc/marketing/**"
---
# Floc — design card

The rules a screen must pass before you call it done, on web, phone and in a mockup. The reasons live in the docs: [approach](../../docs/design/index.html) and [visual language](../../docs/design/visual-language.html). Where they disagree, the visual language wins. `pnpm design:check` enforces the rules marked ✓; `floc:design-review` checks the rest.

**A correction Aidan makes that is not here goes here** (or into `scripts/design/rules.mjs` if a machine can see it), in the same change. Never only in memory.

## The look

- White surfaces (`--sheet`) on an off-white ground (`--paper`), split by hairlines (`--rule`). Depth comes from that, not elevation.
- One blue, `--pen`, means "yours to do". Never spend it on decoration.
- Four pastels mark feature areas: blue Where and Packing, yellow When and Notes, green Days and Tickets, red Money. A pastel is a wash, never a stripe down a card's edge.
- Colour follows meaning and stays the same everywhere: an event's colour is its type (food, activity, transport, and grey for other); an Explore listing's colour is its region; a trip keeps one colour.
- Pro is ink — weight, not a hue. No gold, no Pro star on items or on the account pill.
- Three faces: display (Bricolage Grotesque) for headings, sans (Instrument Sans) for prose and controls, mono (DM Mono) for every figure, date and label. Never money or dates in the display face.
- A file's colour is its category — travel blue, hotel green, tickets yellow, admin red, other grey — the same on Files, the Overview and Dates. `DOC_CATEGORY_SKINS` and `DOC_CATEGORY_CHIPS` in `@floc/core` are the only source.
- A person's face is their initials in their seat colour, in a rounded square — never a picture or icon. Two or more names give the first letter of the first two (AI); one name gives its first two letters (Ai).
- A busy button keeps its own words and adds an ellipsis (`busyMark` in `ui.tsx`), the one status mark that is not a word. It does not swap to "Saving…": the action must stay named, and a disabled button shows no cursor (#632 converts the rest).
- Status always has a word. Never colour or an icon alone. The word may live only in the label (title, `aria-label`, `aria-pressed`) when the mark sits where its meaning is plain:
  - A stop's hotel ribbon on the Overview: the file chip beside it names the booking, and its title and label say Booked.
  - The save heart on Explore fills red when saved; its label says Save or Saved with `aria-pressed` (ADR-042).
- Light and dark use the same token names. No `dark:` variant, no hex literal ✓. Values live in `@floc/core/design/tokens`. The theme choice lives in `localStorage`, never in a column.
- The wordmark is **floc.** with a pen-blue dot, drawn only by `components/system/wordmark.tsx` and, for share cards, `components/system/og-card.tsx`. Share cards use the image renderer's default face: it cannot read our `.woff2` files, and a card must always render (rule 11).
- An outside UI library only where building it would take months, and only if it takes our tokens, type and no-emoji rules.

## Shape, depth and motion

- ✓ Three radii, nothing between: `rounded-sm` / `radius.sm` / `var(--radius-sm)` (8px) for controls, tiles, avatars and rows inside a surface; `rounded-md` (12px) for cards, panels, popovers and dialogs; `rounded-full` / `radius.pill` for chips, badges and dots. A 12px surface holding an 8px row 4px in keeps corners concentric.
- ✓ One type scale, nothing between: 11, 13, 15, 17, 20, 25, 31, 39px (`text-xs` to `text-3xl`, `--text-*` in `globals.css`). A page's sections head at 25px (`SectionHeading`); a card or group inside one heads at 20px. An email is not a screen and keeps its own sizes. Never a size such as 12.5px or 1.05rem to make something fit.
- ✓ Controls in one row share one height. A text button is 31px. An icon on its own takes its box from `ui.tsx`, never a hand-sized square: `iconFrameClass()` (31px, framed, lifts) for an action beside text buttons; `iconFrameClass("row")` (26px, framed) for an action in a list row; `iconButtonClass` (26px, bare) for a `…` menu, a toggle, a pencil and a chevron that opens or closes something, wherever they sit. Below sm all three keep their drawn size and grow their press area. On a coloured head the bare one takes the head's ink (`iconInkClass`).
- One add field per kind of list: both packing lists use `PackingAddField`. A field's visible label is the mono `typed` label.
- Buttons, switches, segments and vote controls are rounded squares (`rounded-sm`), never circles. A chip you press to pick or tick, such as a vibe tag or a part of your profile, is a button too: `rounded-sm`, never a pill.
- A selected thing is never a solid block. The phone's bottom tab bar says the open tab in colour and weight only, with no tile behind it; a selected day or stub is a `pen-2` wash with `pen-deep` ink. ✓ On the web that is `bg-pen-soft text-pen-deep`: `--pen-2` is the variable, and a `bg-pen-2` class draws nothing. Inactive marks stay `ink-2`, not dimmed further, or they read as disabled.
- ✓ Depth comes only from `--shadow-sm`, `--shadow`, `--shadow-lift`. An inset or unblurred shadow may draw a line. If you notice the shadow first, it is wrong.
- Every interactive surface shows a hover: a card lifts 1.5px (never more than 2px), a chip takes a border, a link turns blue. ✓ Never a grey fill; a button hovers to a pen wash.
- Motion: 0.22s on `--ease`, colour and lift only in the workspace. Nothing under reduced motion. Never hijack the scroll. In the homepage feature tour, the feature icon takes the new slide's ink as its copy appears; the trip tab's icon and tile change colour together.
- Longer or larger motion is allowed only where it shows a change the person just made or where they are going, and each case has its own ADR. The cases:
  - A booking site you just added washes pen on its new buttons for about a second (0.22s in, a hold, 0.22s out), so you see every row change ([ADR-037](../../docs/foundation/decisions.html#adr-037)). Colour only.
  - Opening a trip from a My trips bar. The list sinks back and fades (0.3s) while the trip loads and the top bar’s beads join; then the Overview pours out of the bar onto the trip’s card on the beads’ skin, with their give and squash (about 1s; 1.3s in all). Nothing under reduced motion; a new tab or window opens plainly ([ADR-038](../../docs/foundation/decisions.html#adr-038), `lib/trip-open/`).
  - The top bar’s beads fuse as the page scrolls ([visual language](../../docs/design/visual-language.html#navigation-and-chrome)). Scroll sets how far the words have folded; the join plays once. No other workspace surface moves on scroll.

## Words

- ✓ No emoji. Icons are line art: 14×14 `viewBox`, `fill="none"`, `currentColor`. ✓ An icon draws at 13px with a stroke of 1.15–1.25; one that must be another size gets it from its caller, not a new default. Web icons live in `components/system/icons/`.
- A flight is an aeroplane, never a paper plane. Upload is the upload glyph, never a plus.
- No small picture that needs a key to read (dots and hatched squares standing for days): it reads as noise. A glyph and words do the job.
- Never ask what the data already answers. A question about a trip starts from what the trip holds (dates set, places on the route), and a preview of a page shows that trip's own content, or says what is missing.
- If the drawing is clear, say nothing. No heading above a heading, no caption that decodes the design, no instruction, no text that repeats a control. Exceptions: what is missing, and status.
- The account bar is the same five tabs on every account page — Profile, Settings, Saved, Wish lists, Packing — so nothing opens or moves between them; below sm it shows glyphs only (#467, #623).
- A page its tab bar already names (a trip tab, My trips, Friends, Profile, Settings, Saved, Wish lists, Packing) shows no visible page title; the `h1` stays for screen readers (`sr-only`).
- No tiny all-caps kicker above a heading. The mono label names a value; it never introduces a section.
- Sentence case. British English. Real content, never lorem ipsum.
- ✓ A field starts empty: no placeholder, no example, nothing pre-filled the person did not choose. A visible label or an `aria-label` names it.
  - One exception: *Plan the next one* on a finished trip's recap starts with the trip's other members ticked; the name field stays empty (#443).
  - One exception: *Add to Days* on a booking file starts with what Floc read from that booking — the flight, its day and its times — and the member saves it (#559).
- ✓ Money is exact. No `≈` or `~`. A money figure anywhere matches the Money tab, which is the source of truth.

## Layout

- On desktop web, New group and Edit group use the centred dialog. In the trip picker, each group shows its faces first. A separate chevron reveals the members without changing who is ticked.

- One main action per screen. One visible action per row; more verbs go behind a `…` menu. A row may also show the one or two things a person checks or flips at a glance; every other verb stays in the menu:
  - A Saved tile on Lists shows Start trip beside its heart (#467). It is a quiet pen word with an arrow at the right end of the tile's last line, sharing that line with the figures (nights and price, or Explore trips); below sm only the arrow shows, and a trip's nights sit over its price. A compact country tile keeps the house heart size, larger than the mockup's, so its press target stays full size.
  - A My trips card shows two toggles beside its `…`, star and mute (a bell, slashed when muted). Each says its state in its label (`aria-pressed`, Mute/Unmute).
- Rows on one surface beat cards for everything. No borders around borders, no boxes inside boxes.
- Below a panel's coloured head, every part — a field or a section — takes one title style and is ruled off edge to edge from the part above (`panelTitleClass`, `panelBandClass` in `ui.tsx`). A part whose controls name themselves (the event type tiles) needs no title. An empty part shows its button, not a sentence about being empty.
- A field draws one focus ring: the outline sits on the border, never a blue border plus an outline outside it.
- A date is picked on Floc's own month calendar (the Dates grid), never the browser's or the phone's native date picker.
- A text field is the house field (`Input`, `Textarea`): mono, hover to a darker border. Inside a panel, a field that holds prose — a place name, a note — is the same field in sans (`panelFieldClass`). No third field style.
  - One exception: the top of My trips joins a house field, its mono label inside in `ink-2`, to New trip. The pair is one control: the button turns pen once a name is typed and shows hover in colour only, never a lift (`new-trip-field.tsx`). Below sm, a `…` menu holding Archived closes the control on the right.
- Text never overlaps or clips. Test long names (South Africa, Bosnia and Herzegovina), many items and empty states. A chip fits its slot unless the name is long, then it wraps cleanly.
- The page holds still. Switching a tab, day or filter never jumps the scroll or shifts the content above.
- A card that opens something opens from anywhere on it, not only its title.
- Alignment is exact: rows, counts and controls in a group share edges and heights.
- Pictures: one consistent treatment. Image controls sit in one bar under the image, never arrows on top. Map pins stay plain numbers. Your own trip shows no stock photos — photos there are the person's choice.
- Explore filters sit in a left rail, never along the top.
- Say a thing once. On Days, web and phone, stops sit on the day strip and pressing one edits where you sleep — no separate overnight band, and the top of a screen stacks no bands.

## Surfaces

- Every screen reads at 1280 and 375, in light and dark, with no sideways scroll. Plan the narrow layout; do not just shrink.
- Phone: same tokens, glyphs and words, drawn tighter. A row per question is a budget. Two short controls share a line. Cut furniture, never information. Press targets stay full size.
- Phone corrections from Aidan:
  - A colour key fits one line: small marks, the web's words.
  - A lone share button, or a card of link buttons, sits centred. No heading or sentence above it that says what the button does.
  - The section tabs mark the open one with a soft rounded wash, as on the web — never a hard block.
- House components first: web `components/system/ui.tsx` and `client-ui.tsx`; phone `src/components/system/ui.tsx` and `glyphs.tsx`.

## Mockups and builds

- Start a round close to the current design, cleaner and simpler. Show neighbouring sections as ghosts so a variant is never judged alone.
- Mockups open in light with a light/dark switch, and use the kit's real tokens (`/_house/`).
- `frontend-design` helps with craft; this card and the visual language win over its defaults. No gradients, glow or novelty.
- A mockup copies the live site's type: sheet title, part titles, row labels and hints at the web's sizes and weights, so a round is judged on structure, not on drifted type.
- A build matches the chosen mockup. Put them side by side at 1280 and 375 before calling it done.

## Before you say done

Walk the whole task with real content, first use, empty and failure states, on web and phone, light and dark. Run `pnpm design:check`. Ask `floc:design-review` for a fresh look. Report any surface or state you could not check.
