---
name: prototype
description: Build a throwaway prototype or mock-ups to answer a design question. Use when the user says /floc:prototype, asks for mock-ups, variants or options ("give me four mock-ups", "two more like C"), wants to sanity-check whether a state model or logic feels right, or explore what a UI should look like — often on a ticket labelled `wayfinder:prototype`, or when /floc:grill turns up a question only a prototype can answer.
---

In Codex, read [Codex runtime](../../CODEX.md) before following this workflow.

# Prototype

A prototype is **throwaway code that answers a question**. The question decides the shape.

## Pick a branch

Identify which question is being answered — from the user's prompt, the surrounding code, or by asking if the user is around:

- **"Does this logic / state model feel right?"** → [LOGIC.md](LOGIC.md). Build a tiny interactive terminal app that pushes the state machine through cases that are hard to reason about on paper.
- **"What should this look like?"** → [UI.md](UI.md). Several structurally different variations on one static wireframe page, switched by `?variant=`.

The two branches produce very different artifacts — getting this wrong wastes the whole prototype. If the question is genuinely ambiguous and the user isn't reachable, default to whichever branch better matches the surrounding code (a backend module → logic; a page or component → UI) and state the assumption at the top of the prototype.

## Rules that apply to both

1. **No persistence by default.** State lives in memory. Persistence is the thing the prototype is _checking_, not something it should depend on. If the question explicitly involves a database, hit a scratch DB or a local file with a clear "PROTOTYPE — wipe me" name.
2. **Skip the polish.** No tests, no error handling beyond what makes the prototype _runnable_, no abstractions. The point is to learn something fast.
3. **Surface the state.** After every action (logic) or on every variant switch (UI), print or render the full relevant state so the user can see what changed.
4. **Capture it when done.** Record the verdict and the question it settled on the issue. Build the chosen behaviour with `/floc:implement-feature`.

## In Floc

- **Track the source in Git.** Use `pnpm workspace:new <name>` and one folder per prototype under `floc/wireframe/`. Keep screenshots in the ignored `_shots/` folder. When asked to push, use `/floc:push` and include the wireframe source in the normal PR to `develop`.
- **Keep it throwaway.** Give the prototype a browser or terminal check. Unit tests, coverage, lint, fitness and the product design-review gate apply to the app implementation. Secret scanning still applies to wireframe source.
- **Serve the worktree copy.** Run `pnpm workspace:start wireframes` and use the wireframe port from `pnpm workspace:status`. `pnpm wireframe` serves the main checkout on http://localhost:4100. The root lists each prototype by app page.
- **Label it in `<head>`, under `<title>`.** The root reads these; without them the prototype lands in "Not labelled".

  ```html
  <meta name="wf-page" content="Packing">                 <!-- the app page, as the user names it -->
  <meta name="wf-route" content="/trip/[id]/packing">
  <meta name="wf-status" content="Exploring: A–F">       <!-- see "Close a round" -->
  <meta name="description" content="One line: what question this answers.">
  ```

  `wf-page` must be a page name from `SECTIONS` in `scripts/wireframe/nav.js`, or it lands in "Other".
- **Plain HTML, CSS and JS.** No build, no framework, no packages from a CDN. Every page links the house base:

  ```html
  <link rel="stylesheet" href="/_house/house.css">
  <script src="/_house/house.js" defer></script>
  ```

  `house.css` loads the real token values from `@floc/core/design/tokens` (light and dark), the three faces, `.typed`, `.nums`, `.who-1`…`.who-8`, `.avatar`, `.btn`. `house.js` adds the light/dark switch; the page opens in light. Token names: `curl -s localhost:4100/_house/tokens.css`.
- **Use the kit before writing your own.** `/_house/` serves `scripts/wireframe/` (tracked, so a worktree has it too):

  | File | Gives |
  |---|---|
  | `switcher.js` | `variants(list, render)`: the variant panel and `?variant=` |
  | `kit/trip-frame.mjs` · `.css` | `tripFrame(tab, me)`: header, beads, trip tabs; `ico`, `avatar`, date helpers, `openSheet`, `toast`, `isNarrow` |
  | `kit/chrome.js` · `.css` | The trips-list and packing frame (`window.Kit`) |
  | `kit/nav-glyphs.js` | Header and tab glyphs (`window.NavGlyphs`) |
  | `kit/shoot.mjs` | Screenshots: `pnpm wireframe:shoot` |

  A helper two prototypes need goes in the kit, not in a copy.
- **House look, still.** Colours only through `var(--token)`, never hex. Line icons (14×14 `viewBox`, stroke only), no emoji. Copy the shapes from `components/system/` by eye; do not import them. Otherwise the verdict judges the wrong thing.
- **Realistic data, in the file.** A static page cannot reach the database. Write believable trips, people and plans in the prototype's own JS, shaped like scenario A (`/floc:seed-dev-db` shows what that holds). Real words, never lorem ipsum.
- **Interactive beats pretty.** The user clicks and types in it to learn how it feels. State lives in memory; a reload starts over.
- **Variants.** Several answers to one question → `?variant=` on the same page, listed in the house panel on the right (`switcher.js`). One agreed direction that the grill keeps changing → one page, edited round by round. How the rounds run: [Rounds](#rounds).
- **Web and mobile web, every variant.** Every variant must work and read clearly at desktop width (1280) and phone width (375), in the same page. Do not just let it shrink: plan the narrow layout on purpose.
  - Stack side-by-side parts, and put the thing that matters first.
  - A wide device (a browser window, a map) may become a phone on a narrow screen.
  - Lines, hover and side notes do not survive a phone. Replace them with something visible, such as numbered badges that pair a note with its row.
  - No sideways scroll: `scrollWidth` equals the screen width.
  - Nothing swaps itself out while someone is reading it on a phone (no autoplay there).
  - Controls stay in reach, for example a sticky stepper.

  Shoot both widths, in light and dark. A variant that fails at 375 is not done.
- **UI, phone app.** Draw the phone as a 390×844 frame on the same page, when the question is phone-specific. Otherwise the web answer carries over through the [visual language](docs/design/visual-language.html).
- **Logic.** A TUI in `floc/wireframe/<issue>-<slug>/tui.ts`, run with `node <file>.ts`. It may import pure modules from `@floc/core` by relative path; it never writes them.
- **Hand it over with proof.** Set `FLOC_WIREFRAME_PORT` to the worktree's wireframe port and run `pnpm wireframe:shoot "/<folder>/?variant=A" floc/wireframe/<folder>/_shots/A-1280.png [light|dark] [width] [height] [full]`. The runner accepts `STEPS="click:<sel>;;hover:<sel>;;wait:300"` and `CLEAN=1` to hide the prototype controls. Report any page errors or overflow. Send the screenshots and the URL with `?variant=`.
- **Capture the verdict on the ticket.** Add `## Prototype verdict` with the question, the answer, why and the folder name. Remove the `wayfinder:prototype` label. Use `/floc:grill` for open decisions.

## Rounds

What has worked, round by round, on the landing wireframes:

1. **Round 1: the number asked for, else 3–6.** Keys `A`, `B`, `C`… Each is structurally different, not a recolour. Read what the user likes on neighbouring bands or pages first, and name it: a new band must sit beside them. Show the neighbours as ghost sections ("Above: … — unchanged") so it is never judged alone. Read the [design card](.claude/rules/design.md) first; start close to the current design unless asked to be bold. For a visual brief, `frontend-design` may help with craft, but the card and the visual language win over its defaults.
2. **Real content.** Copy real data into the file: listings from `@floc/core` (preset trips, prices, stops), tokens through `house.css`. Invent only what the product does not hold yet.
3. **Feedback round.** Keep variants while the user compares them. Add new takes after the old ones and update the description. Prune the round when the user closes it or asks to implement the pick.
4. **Refine the pick in place.** A change to one variant → a suffixed variant beside it (`G2`), so the original stays to compare. Later rounds edit `G2` itself.
5. **Motion.** Asked for "some, not too much": one moment, not scattered effects. When two things must move together (a map line and a bar), drive both from one JS clock, not two CSS animations. Reduced motion → show the end state.
6. **Outside resources.** Anything fetched (map tiles, fonts) must answer without a key: check it returns 200 with the right content before you use it. Note what the real build will use and its credits. A wireframe choice is not a provider decision.
7. **Keep the history.** After each round, write the picks and the reasons to memory, so the next session does not redo them.

## Close a round

Use `Exploring: A–C` while the user compares options. Record a pick as `Chosen: A` and add `<meta name="wf-picked" content="YYYY-MM-DD">`. Use `Experiment: <keys>, <question>` for pages kept to test with users. In a mixed page, tag each experiment in the variant list.

If the user says “implement A” or asks to close the round, prune it in the task worktree before starting the implementation:

1. Keep the chosen variant and any variants explicitly marked as experiments. Delete the other renderers, variant registrations and assets used only by those options. Keep code shared by the surviving variants.
2. Delete sibling prototype folders for the same decision when they contain no pick or experiment. Delete the whole prototype if the user closes it without either. Git holds the history. Delete with `pnpm wireframe:delete <path> [...]`, paths relative to `floc/wireframe/`; it works in any worktree and refuses anything outside that folder. Never `rm -r` or `Remove-Item -Recurse`: both are denied.
3. Update the metadata and variant list, and open the surviving variants to check their controls and assets. Include the deletions in the implementation PR.
