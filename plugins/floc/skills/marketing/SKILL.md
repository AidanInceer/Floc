---
name: marketing
description: Make and iterate on a Floc marketing post (Reel or stills) in the marketing studio — build variants, act on the timed notes Aidan leaves in the studio, refine the pick, then render it into the raw → reviewed → live pipeline. Use when the user says /floc:marketing, "new marketing post", "make variants of the promo", "go through my studio notes", or "iterate on <post>".
---

# marketing

A post is iterated in `floc/pipelines/marketing/studio/` like a wireframe, then rendered into `content/` and posted by the pipeline. The studio is for choosing; the pipeline is for shipping. Pipeline rules: [README](../../../../floc/pipelines/marketing/README.md).

## Where things are

| Path | Holds |
|---|---|
| `studio/scenes/<scene>/` | One variant: `index.html` + `scene.js`, built on `studio/shared/engine.js`. Committed. |
| `studio/scenes/<scene>/review.json` | Status (`exploring`, `chosen`, `parked`) and timed notes. Written by the studio page. Committed. |
| `studio/_studio/` | The studio page. |
| `content/{raw,reviewed,live}/<slug>/` | Rendered pieces. See the README. |

The studio runs with `preview_start` name `marketing-studio` (http://localhost:4200), or `pnpm marketing studio`. Every variant of a post plays side by side on one clock. Aidan scrubs, adds a note at a time, and picks or parks a variant.

## 1. Read first

- [Mission and values](../../../../docs/foundation/mission.html) and [visual language](../../../../docs/design/visual-language.html). A post says what Floc is; it never claims what Floc does not do.
- `src/facts.ts`: the only prices a post may quote. Check `server/billing/billing.ts` if a price is in doubt.
- Each existing variant of the post, and its `review.json`.

## 2. Label every variant

In `<head>`, under `<title>`. The studio groups and sorts by these:

```html
<meta name="mk-type" content="Reel">             <!-- the sidebar folder: Reel, Still, Carousel, Story -->
<meta name="mk-post" content="launch-promo">     <!-- the post: a slug, shared by every variant -->
<meta name="mk-variant" content="C2">            <!-- the key Aidan answers with -->
<meta name="description" content="One line: what this variant tries.">
```

Folder name: `<post>-<key>` in lower case (`launch-promo-c2`). Older scenes keep their names (`v5-free-pro`).

## 3. Rounds

1. **Round 1: the number asked for, else 3.** Keys `A`, `B`, `C`. Each tries a different idea (hook, story, pace), not a recolour. Copy the closest scene as a start; reuse `engine.js` helpers (`caption`, `endCard`, `pose`, `p`, `out3`).
2. **Read the notes.** `review.json` in each scene: `{ status, notes: [{ id, t, text }] }`. `t` is seconds into the scene; open `/<scene>/index.html?t=<t>` to see that frame.
3. **Act on notes in a new variant, never in place.** A note on `C` → `C2` beside it (on a key that ends in a digit, add a letter: `V2` → `V2b`) (copy the folder, edit the copy, set `mk-variant`). Later notes on `C2` edit `C2` only if Aidan has not picked it yet; otherwise `C3`. The original stays to compare. A merge asked for ("B's hook on C") → its own key.
4. **Clear what you handled.** Remove a handled note from the new variant's copy of `review.json` (delete the file in the copy if it holds no notes). Leave notes on the original as the record. A note you could not do: keep it, and say so in the report.
5. **Pace.** Viewers read slowly on a phone. Hold every line at least 1.5 s plus 0.3 s per word, and one idea per screen.

## 4. House rules for every frame

- Colours from tokens only (`var(--pen)`), never a new hex. The scenes load the real tokens through `/_house/tokens.css`.
- No emoji. Icons are line art, `stroke="currentColor"`.
- British English, sentence case, real trip content. No price outside `facts.ts`.
- The scene is a pure function of time: `run(DURATION, frame)`, everything drawn from `t`. No timers, no `Math.random()` without a fixed seed, or the render and the studio will differ.

## 5. Check before you hand it over

- The studio page shows the variant, with no console errors (`read_console_messages`).
- Seek to each note's time and to the end card; screenshot the key moments.
- Give Aidan the studio URL with `?post=<post>` and the new keys.

## 6. From pick to post

When Aidan picks a variant (status `chosen` in the studio, or says so):

1. `pnpm marketing render <scene> --as <post>` → `content/raw/<post>/media.mp4` and an empty `post.md`.
2. Draft the caption in `post.md`: short, British English, no emoji, at most 30 hashtags. Show it to Aidan.
3. `pnpm marketing approve <post>` only when Aidan agrees the caption. The checks run there.
4. **Never run `publish` without a yes in chat for that post.** Posting is public and cannot be taken back. `publish --dry-run` is always fine.

## 7. Keep the history

After each round, write the picks and the reasons to memory (one file per post), so the next session does not redo them.

Report: post → variants added (key: what it tries) → notes done / notes left → studio URL. Nothing else.
