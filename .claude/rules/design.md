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
- Colour follows meaning and stays the same everywhere: an event's colour is its type (food, activity, transport); an Explore listing's colour is its region; a trip keeps one colour.
- Pro is ink — weight, not a hue. No gold, no Pro star on items or on the account pill.
- Three faces: display (Bricolage Grotesque) for headings, sans (Instrument Sans) for prose and controls, mono (DM Mono) for every figure, date and label. Never money or dates in the display face.
- Status always has a word. Never colour or an icon alone.
- Light and dark use the same token names. No `dark:` variant, no hex literal ✓.

## Shape, depth and motion

- ✓ Three radii, nothing between: `rounded-sm` / `radius.sm` / `var(--radius-sm)` (8px) for controls, tiles and rows inside a surface; `rounded-md` (12px) for cards, panels, popovers and dialogs; `rounded-full` / `radius.pill` for chips, badges, avatars and dots. A 12px surface holding an 8px row 4px in keeps corners concentric.
- Buttons, switches, segments and vote controls are rounded squares (`rounded-sm`), never circles.
- ✓ Depth comes only from `--shadow-sm`, `--shadow`, `--shadow-lift`. An inset or unblurred shadow may draw a line. If you notice the shadow first, it is wrong.
- Every interactive surface shows a hover: a card lifts 1.5px (never more than 2px), a chip takes a border, a link turns blue. ✓ Never a grey fill; a button hovers to a pen wash.
- Motion: 0.22s on `--ease`, colour and lift only in the workspace. Nothing under reduced motion. Never hijack the scroll.
  - One exception: the top bar’s beads fuse as the page scrolls ([visual language](../../docs/design/visual-language.html#navigation-and-chrome)). Scroll sets how far the words have folded; the join plays once. No other workspace surface moves on scroll.

## Words

- ✓ No emoji. Icons are line art: 14×14 `viewBox`, ~13px, `fill="none"`, stroke 1.15–1.25, `currentColor`. Web icons live in `components/system/icons/`.
- A flight is an aeroplane, never a paper plane. Upload is the upload glyph, never a plus.
- No small picture that needs a key to read (dots and hatched squares standing for days): it reads as noise. A glyph and words do the job.
- If the drawing is clear, say nothing. No heading above a heading, no caption that decodes the design, no instruction, no text that repeats a control. Exceptions: what is missing, and status.
- No tiny all-caps kicker above a heading. The mono label names a value; it never introduces a section.
- Sentence case. British English. Real content, never lorem ipsum.
- ✓ A field starts empty: no placeholder, no example, nothing pre-filled the person did not choose. A visible label or an `aria-label` names it.
- ✓ Money is exact. No `≈` or `~`. A money figure anywhere matches the Money tab, which is the source of truth.

## Layout

- One main action per screen. One visible action per row; more verbs go behind a `…` menu.
- Rows on one surface beat cards for everything. No borders around borders, no boxes inside boxes.
- Text never overlaps or clips. Test long names (South Africa, Bosnia and Herzegovina), many items and empty states. A chip fits its slot unless the name is long, then it wraps cleanly.
- The page holds still. Switching a tab, day or filter never jumps the scroll or shifts the content above.
- A card that opens something opens from anywhere on it, not only its title.
- Alignment is exact: rows, counts and controls in a group share edges and heights.
- Pictures: one consistent treatment. Image controls sit in one bar under the image, never arrows on top. Map pins stay plain numbers. Your own trip shows no stock photos — photos there are the person's choice.
- Explore filters sit in a left rail, never along the top.

## Surfaces

- Every screen reads at 1280 and 375, in light and dark, with no sideways scroll. Plan the narrow layout; do not just shrink.
- Phone: same tokens, glyphs and words, drawn tighter. A row per question is a budget. Two short controls share a line. Cut furniture, never information. Press targets stay full size.
- House components first: web `components/system/ui.tsx` and `client-ui.tsx`; phone `src/components/system/ui.tsx` and `glyphs.tsx`.

## Mockups and builds

- Start a round close to the current design, cleaner and simpler. Show neighbouring sections as ghosts so a variant is never judged alone.
- Mockups open in light with a light/dark switch, and use the kit's real tokens (`/_house/`).
- `frontend-design` helps with craft; this card and the visual language win over its defaults. No gradients, glow or novelty.
- A build matches the chosen mockup. Put them side by side at 1280 and 375 before calling it done.

## Before you say done

Walk the whole task with real content, first use, empty and failure states, on web and phone, light and dark. Run `pnpm design:check`. Ask `floc:design-review` for a fresh look. Report any surface or state you could not check.
