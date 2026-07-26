# Research — how to embed a map, concretely

Findings for [ticket 14](../../../../.scratch/waypoint-v0.2/issues/14-map-embed-options.md),
which ticket 08 (a map at the top of the Route tab) decides from. **This
document does not pick an option.**

Sources are primary (Mapbox, Stadia Maps, Next.js) and linked inline. **All
pricing was read on 26 July 2026** and is not quoted anywhere in the app — it
changes, and a figure copied into code will rot.

## Headline: two facts that outrank the embed question

**1. Permanent Geocoding has no free tier.** V1 ticket 09 chose Mapbox
specifically because `permanent=true` lets us persist a `place` row. Mapbox's
pricing page lists Permanent Geocoding with **no free allowance at all**, at
**$5.00 per 1,000 requests** from the first request, and the Geocoding docs add
that it "requires that you have a valid credit card on file or an active
enterprise contract". Temporary geocoding is free to 100,000/month but
"Temporary results are not allowed to be cached" — which is exactly what our
`place` table does.

So the geocoding decision that v1 ticket 09 made is **not free**, and ticket 12
(provision Mapbox) will hit a card requirement immediately. This is a fact for
tickets 12 and 10, and arguably reopens ticket 09 — flagging it, not deciding
it.

**2. Stadia Maps' free tier forbids commercial use.** Its pricing page states
plainly: "Commercial use not allowed" on the free tier, with the first paid
tier at $20/month. The v1 runner-up is therefore free only while Waypoint is
non-commercial — and ticket 03 is currently deciding whether Waypoint takes
money from operators.

## 1. Mapbox Static Images API

A single GET returning a PNG/JPG. No JavaScript, no client library, nothing
running in the browser.

**Request shape** ([docs](https://docs.mapbox.com/api/maps/static-images/)):

```
https://api.mapbox.com/styles/v1/{username}/{style_id}/static/{overlay}/{position}/{width}x{height}{@2x}{.format}
```

`{position}` takes coordinates (`lon,lat,zoom[,bearing][,pitch]`), a bounding
box, or the literal **`auto`**, which fits the viewport to the overlay's own
bounds. `auto` answers ticket 08's zoom/bounds question for free — including
the awkward cases (one stop, stops on different continents).

**Overlays** are comma-joined, z-ordered by position (last on top):

- Marker: `{name}-{label}+{color}({lon},{lat})` — `name` is `pin-s` or `pin-l`;
  `label` is alphanumeric **`a-z` or `0-99`**, or a Maki icon name.
  **Numbered stop pins work natively**, up to 99.
- Custom marker: `url-{encoded_url}({lon},{lat})` — the image must not exceed
  1,024px in either dimension. This is the hook for a hand-drawn pin in the
  paper style.
- Path: `path-{strokeWidth}+{strokeColor}-{strokeOpacity}+{fillColor}-{fillOpacity}({polyline})`,
  taking an encoded polyline.

**Limits:** width and height each between 1 and 1,280px; the **whole URL must
be ≤ 8,192 characters**; default rate limit 1,250 req/min, `429` past it. No
documented cap on marker or overlay count — the URL length limit is the real
ceiling, and it is the constraint to watch, since an encoded polyline plus a
dozen pins eats characters quickly.

**Cost:** free to 50,000 requests/month, then $1.00 per 1,000 (falling to $0.60
past a million).

**Token exposure — the important subtlety.** Rendering the URL into a
server-side `<img src>` does **not** hide the token: the browser must fetch
that URL, so the token is in the page source and in the network tab regardless
of where the string was assembled. Server-rendering the *markup* is not
server-rendering the *request*. Two ways out:

- Use a **public (`pk`) token with URL restrictions** and accept it is visible.
  Per the [tokens docs](https://docs.mapbox.com/api/accounts/tokens/), a public
  token "may only contain scopes with the `public` property set to `true`", and
  `allowedUrls` restricts which origins may use it. Restrictions stop the token
  being used on *other* sites; they do **not** stop anyone reading it or using
  it from within an allowed origin.
- **Proxy through a route handler**: our own `/api/map/...` fetches Mapbox with
  a **secret (`sk`) token** server-side and streams the image back. The token
  never reaches the browser, and it also means no request to a third-party host
  from the user's browser at all (see §4). Costs us the bandwidth and a cache
  story.

## 2. Mapbox GL JS

Full interactive vector map — pan, zoom, rotate.

**Cost:** free to 50,000 map loads/month, then **$5.00 per 1,000** — five times
the static rate at the first paid band, and a "load" is one map
initialisation, so a user opening the Route tab three times is three loads.

**Next.js App Router fit** is the known-awkward part. From the search results
and [Next.js lazy-loading docs](https://nextjs.org/docs/app/guides/lazy-loading):

- GL JS needs `window`. A `"use client"` component still renders on the server
  for the initial HTML frame, so the component must be excluded from SSR —
  `dynamic(() => import('./Map'), { ssr: false })`.
- **`ssr: false` is not allowed in a Server Component** in the App Router; the
  `dynamic()` call has to live inside a Client Component. That means a wrapper
  layer purely to satisfy the bundler.
- `mapbox-gl/dist/mapbox-gl.css` is global CSS from `node_modules`, which
  Next.js restricts — a recurring source of friction
  ([discussion](https://github.com/vercel/next.js/discussions/42319),
  [issue](https://github.com/alex3165/react-mapbox-gl/issues/643)).

Against `apps/web`'s "Server Components by default" convention, this is the
option that fights the architecture hardest.

**Token:** necessarily a public `pk` token in the browser, mitigated only by
URL restrictions.

## 3. MapLibre GL + a non-Mapbox tile source

MapLibre is the open fork of GL JS; it needs a tile provider. Stadia Maps was
v1 ticket 09's runner-up.

**Stadia styles** ([docs](https://docs.stadiamaps.com/themes/)) are unusually
well-matched to the paper aesthetic:

- **Stamen Watercolor** — explicitly "hand drawn maps" with "raster effect area
  washes and organic edges over a **paper texture**". This is the closest thing
  any provider offers to Waypoint's design language, and it is the single most
  interesting finding for ticket 08's styling question.
- **Stamen Toner** (and Toner Lite) — high-contrast black and white, described
  as "the perfect backdrop for your colorful and eye-catching overlays".
- **Alidade Smooth** — muted and minimal, "designed for maps that use a lot of
  markers or overlays".

**Cost** ([pricing](https://stadiamaps.com/pricing/)): 200,000 credits/month
free, **but "Commercial use not allowed"** on that tier. Starter is $20/month
for 1,000,000 credits. Basemap tiles are 1 credit each; **static maps are 20
credits per request, or 2,000 credits for a "cacheable" static map** — so
Stadia's static product is dramatically more expensive per request than
Mapbox's, and caching one costs a hundred times more again. An API key is
required. Attribution requirements are not stated on the pricing or themes
overview pages — they sit on the individual style pages and **need checking per
style before any of these are used**, particularly the Stamen ones.

Note this option also implies **two providers**: Stadia for tiles, Mapbox still
for geocoding (or a third for that too).

## 4. Cookies and third-party browser requests

The app deliberately has no consent UI, and v1 ticket 07 already flagged Mapbox
cookie consent for real legal review. What the research does and does not
settle:

- **A proxied static image makes no third-party browser request at all.** The
  browser talks only to our origin. This is the one configuration that is
  unambiguously clear of the question.
- **A non-proxied static image** makes a plain GET to `api.mapbox.com`. That
  discloses the user's IP to Mapbox. Mapbox's ToS FAQ notes IP addresses are
  "retained in cloudfront logs for 30 days for billing and customer usage
  reporting". Whether an `<img>` fetch sets anything in the browser is **not
  established** — see the gap below.
- **GL JS** runs Mapbox code in the page, makes many requests, and Mapbox's ToS
  FAQ describes telemetry with "session IDs" that rotate "every 24 hours" and
  location data anonymisation. That is a materially larger surface.

**Gap — I could not confirm this.** [Mapbox's cookie
policy](https://www.mapbox.com/legal/cookies) did not yield a usable cookie
inventory: the fetched page has a "Types of Cookies" heading with no content
under it, and distinguishes nothing between GL JS, Static Images, and embedded
maps. **Do not treat "static images set no cookies" as established** — it is
plausible and unverified. Resolving it properly means either the Manage Cookies
interface on that page, `privacy@mapbox.com`, or observing the response headers
directly once ticket 12 has a token. The last is cheapest and is the honest way
to close this.

## 5. Styling

Mapbox styles are customisable in Mapbox Studio and the resulting `style_id`
drops straight into the **Static Images URL as well as GL JS** — the same
custom style serves both, so styling reach does not discriminate between the
two Mapbox options.

**Attribution** ([docs](https://docs.mapbox.com/help/getting-started/attribution/))
does constrain the design:

- **GL JS** adds attribution bottom-right automatically: the Mapbox logo plus
  text linking "© Mapbox", "© OpenStreetMap" and "Improve this map". Font
  colour and size may be adjusted "to match your design" provided attribution
  "must be legible"; the logo itself may not be altered. Both may be
  repositioned but "must stay visible on the map".
- **Static images** need text attribution "in a textual description near the
  image" — so it can sit *outside* the frame, which is far kinder to a
  ruled-paper layout than an overlay. Plain-text fallback is "© Mapbox, ©
  OpenStreetMap". The logo must still be shown, sourced separately from the
  press page.
- Text attribution may shorten to the logo alone only when using a custom style
  or custom data hosted by Mapbox *without* Mapbox's own styles or tilesets —
  which is not our case.

## 6. Directions

Drawing a real road route (rather than straight lines between stops) needs the
separate **Directions API**: free to 100,000 requests/month, then $2.00 per
1,000. Its output is an encoded polyline, which is exactly what the Static
Images `path-` overlay consumes — mechanically, the two compose cleanly.

**Gap — the terms are unresolved.** Whether Directions results may be cached,
for how long, and whether they may be displayed on a **non-Mapbox basemap**
(the MapLibre/Stadia option) is governed by the Mapbox Product Terms, which are
published only as a PDF (dated 21 July 2026, linked from
[mapbox.com/legal/product-terms](https://www.mapbox.com/legal/product-terms))
and which did not yield readable text when fetched. The general ToS page does
not cover it. **This must be read before combining Mapbox Directions with
non-Mapbox tiles**, and before caching a route. Historically providers restrict
exactly this combination — but that is an expectation, not a finding, and it is
not recorded here as fact.

## Comparison

| | Cost (free tier → first paid band) | Token exposure | Third-party browser requests | SSR / App Router fit | Styling reach |
|---|---|---|---|---|---|
| **Static Images, proxied** | 50k/mo free → $1.00/1k | **None** — `sk` stays server-side | **None** — browser talks only to us | Perfect — an `<img>`, zero client JS | Full Studio styles; attribution can sit outside the image |
| **Static Images, direct** | as above | `pk` in page source; URL restrictions limit origin, not reading | One GET to `api.mapbox.com`; IP disclosed, cookies **unverified** | Perfect — an `<img>`, zero client JS | as above |
| **Mapbox GL JS** | 50k loads/mo free → **$5.00/1k** | `pk` in browser, necessarily | Many, plus telemetry with rotating session IDs | **Poor** — needs `ssr:false` inside a Client Component wrapper; `node_modules` CSS friction | Full Studio styles; attribution overlays the map, logo unalterable |
| **MapLibre + Stadia** | 200k credits/mo free but **commercial use forbidden** → $20/mo; static maps 20 credits (2,000 if cacheable) | Stadia key in browser | Many, to Stadia | Poor — same client-only constraints as GL JS | **Stamen Watercolor is a genuine paper-textured map**; attribution per-style, unchecked |

## What ticket 08 still has to find out

Three things this research could not close:

1. **Do Mapbox static image responses set anything in the browser?** Unverified;
   the cookie policy page yielded nothing. Cheapest resolution: inspect response
   headers once ticket 12 provides a token.
2. **May Directions results be cached, and displayed on a non-Mapbox basemap?**
   In the Product Terms PDF, which did not parse. Must be read before that
   combination is built.
3. **Stadia's per-style attribution requirements**, particularly for the Stamen
   styles — on the individual style pages, not the overview.

And one question for ticket 08 that the research reframes rather than answers:
the ticket asks whether Route wants "a *diagram* of the route or a *map* you
explore". On cost, on token exposure, on third-party requests, and on fit with
Server Components, **every axis except interactivity itself favours the static
option** — which makes that the question the whole decision turns on.

## Also relevant to other tickets

- **Ticket 12 (provision Mapbox):** permanent geocoding needs a card on file
  from the first request; there is no free tier. Budget for it, and check
  whether existing `place` rows were created under temporary geocoding — if so
  they were, strictly, not permitted to be stored.
- **Ticket 09 (v1, maps provider):** the "permanent geocoding" reasoning that
  chose Mapbox holds technically but is not free. Worth a second look.
- **Ticket 10 (roadmap):** a card on file for Mapbox is a pre-deploy blocker.
