# floc-marketing

Make marketing visuals from Floc's own design tokens, review them, and post them to Instagram only when you choose to.

## Studio

`pnpm marketing studio` (or `preview_start` name `marketing-studio`) serves http://localhost:4200. Each post's variants play side by side on one clock. Scrub, add a note at a time, then pick or park a variant. Notes and the pick are saved to `studio/scenes/<scene>/review.json`; `/floc:marketing` reads them and makes the next round. A scene names its type, post and key in `<head>`: `mk-type` (the sidebar folder: Reel, Still…), `mk-post`, `mk-variant`, `description`.

When a variant is picked: `pnpm marketing render <scene> --as <post>`, and the piece enters the stages below.

## Stages

Each piece is one folder. The folder it sits in is its state.

| Folder | Means | Gets there by |
|---|---|---|
| `content/raw/<slug>/` | Rendered, not yet checked | `render` |
| `content/reviewed/<slug>/` | Caption and media pass the checks; ready to post | `approve` (back with `reopen`) |
| `content/live/<slug>/` | Posted. `published.json` holds the Instagram id, permalink, time and file hash | `publish` |

A piece holds `post.md` (the caption, hashtags included) and its media: one `media.mp4` (a Reel) or one or more `.png` stills. Media is gitignored and re-renders from `studio/`; captions and publish records are committed.

`approve` and `publish` both run the checks: caption not empty, at most 2,200 characters and 30 hashtags, no emoji, no American spellings, and no price Floc does not charge (`src/facts.ts`).

## Commands

Run from the repo root, in PowerShell:

```powershell
pnpm marketing studio                              # review variants on :4200
pnpm marketing scenes                              # what studio/scenes holds
pnpm marketing render v5-free-pro                  # -> content/raw/v5-free-pro/media.mp4 + empty post.md
pnpm marketing render v5-free-pro --stills 3,12    # stills at those seconds instead of a video
pnpm marketing render v5-free-pro --as v5-autumn   # same scene, new piece
pnpm marketing status
pnpm marketing approve v5-free-pro
pnpm marketing publish v5-free-pro --dry-run       # shows what would post
pnpm marketing publish v5-free-pro                 # asks you to type yes, then posts
pnpm marketing publish v5-free-pro --yes           # no question: for a scheduled run later
```

A new scene is a folder in `studio/scenes/` with `index.html` and `scene.js`, using `studio/shared/engine.js`. `render` needs ffmpeg (`winget install Gyan.FFmpeg`).

## Instagram setup (once)

Publishing stays off until `.env.local` holds both ids. Without them, `publish` says what is missing and posts nothing.

1. Create the Instagram account and switch it to a professional account (Business).
2. Create a Facebook Page for Floc and link the Instagram account to it.
3. In Meta Business Manager, add the Page and the Instagram account to the business.
4. On developers.facebook.com, create a Business app and add the Instagram product.
5. In Business settings → System users, add a system user, give it the app and the Instagram account, and generate a token with `instagram_basic`, `instagram_content_publish`, `pages_show_list` and `pages_read_engagement`.
6. Find the Instagram user id: `GET https://graph.facebook.com/v23.0/me/accounts?fields=instagram_business_account` with that token.
7. Copy `.env.example` to `.env.local` and fill in both values. Never commit it.
8. `pnpm marketing publish <slug> --dry-run`, then the real run.

Stills cannot be published yet: Instagram fetches images from a public URL, and none is set up. Reels upload straight from this machine.
