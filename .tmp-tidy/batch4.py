import io


def sub(path, old, new):
    s = io.open(path, encoding="utf-8", newline="").read()
    crlf = "\r\n" in s
    o = old.replace("\n", "\r\n") if crlf else old
    n = new.replace("\n", "\r\n") if crlf else new
    assert s.count(o) == 1, (path, "matches=%d" % s.count(o), old[:60])
    io.open(path, "w", encoding="utf-8", newline="").write(s.replace(o, n))


p = "floc/apps/web/src/server/notes/note-doc.ts"
sub(p, """/**
 * The trip's Notes doc (ticket 238) — one row per trip, one JSON blob.
 *
 * The blob is BlockNote's own `Block[]` and is never parsed here: the editor
 * is the only thing that understands its shape, so the server's job is to hand
 * the same string back. Last-write-wins (rule 7), no version check.
 */""",
    """/**
 * The trip's Notes doc (#238) — one row per trip, one JSON blob.
 *
 * Why: the blob is BlockNote's own `Block[]` and is never parsed here; only the editor understands
 * its shape, so the server hands the same string back. Last-write-wins (rule 7), no version check.
 */""")
sub(p, """/**
 * A starting document of bullets — Explore's "start this trip" seed (ticket 39,
 * rehomed here when the idea board went). The one place we *write* the blob's
 * shape rather than hand it back untouched; BlockNote loads partial blocks, so
 * a type and content are all a bullet needs.
 */""",
    """// Why: the one place the blob's shape is written rather than handed back — BlockNote loads
// partial blocks, so a type and content are all a bullet needs (#39).""")
sub(p, """/** The saved document, or null when nobody has written in this trip yet. */
""", "")
sub(p, """/**
 * Replace the whole document.
 *
 * Wider than rule 7's field-level last-write-wins, and worth being plain about:
 * the editor writes the snapshot it loaded with, so a tab left open all morning
 * overwrites everything anyone else added in the meantime, and neither side is
 * told. The reload guard is ticket 238's stated follow-up.
 *
 * `deletedAt: null` on conflict matches the vote upsert: the unique index
 * doesn't know about soft-delete, so without the reset a cleared doc would
 * swallow every later save.
 */""",
    """/**
 * Why: wider than rule 7's field-level last-write-wins — the editor writes the snapshot it loaded
 * with, so a tab left open all morning silently overwrites everyone else. Reload guard is #238's
 * follow-up. `deletedAt: null` on conflict because the unique index does not know about
 * soft-delete, and without it a cleared doc swallows every later save.
 */""")

p = "floc/packages/floc-api/src/routers/me.ts"
sub(p, """/**
 * The signed-in person (ticket 302).
 *
 * WHAT YOU CURATE, NOT WHAT YOU CONFIGURE. The web app splits profile from
 * settings and the phone keeps the split, so this carries a name, a picture
 * and the travel map's counts — and nothing about visibility, notifications or
 * the account. Those are settings, they are edited on the web, and collapsing
 * the two produces an endpoint that is neither.
 *
 * `been` and `wantToGo` are derived on read from the trips you are on, never
 * stored (#95), so they cannot disagree with the map the web app draws.
 */""",
    """/**
 * The signed-in person (#302) — what you curate, not what you configure.
 *
 * Why: the web splits profile from settings and the phone keeps the split, so nothing about
 * visibility, notifications or the account belongs here. `been` and `wantToGo` are derived on read
 * from the trips you are on, never stored (#95), so they cannot disagree with the web's map.
 */""")
sub(p, """  /**
   * The face: vibe tags, the travel map and the trips you have been on. Its
   * own procedure because every screen wanting the viewer's id calls `get`,
   * and none of them want a map with it.
   */""",
    """  // Why: its own procedure because every screen wanting the viewer's id calls `get`, and none of
  // them want a travel map with it.""")
sub(p, """  /**
   * The travel map's hand marks (ticket 108). Trip marks are derived on read
   * and are nobody's to edit; these are the ones you paint yourself.
   *
   * `blank` is not simply "delete". Over a country a trip still claims it
   * stores a rejection — "no, I didn't go" — because without one the app goes
   * on asserting something false. The host tells the two cases apart.
   */""",
    """  // Why: `blank` is not delete — over a country a trip still claims, it stores a rejection, or
  // the app goes on asserting something false. The host tells the two cases apart (#108).""")
sub(p, """  /**
   * Questions a trip left behind when you stopped being on it (ticket 95).
   * Its countries stop being derived the moment the membership ends, so this
   * is the only moment they can be kept. Nobody answers it for somebody else.
   */""",
    """  // Why: a trip's countries stop being derived the moment the membership ends, so this is the
  // only moment they can be kept (#95).""")

p = "floc/packages/floc-core/src/trip/tags.ts"
sub(p, """/**
 * Trip tags (ticket 71) — free text, normalised here so the same label typed
 * two ways in two trips is still one tag on the /trips filter.
 *
 * Pure, no DB access: `trip.tags` is a JSON column and every writer runs its
 * input through `parseTags` first, so nothing unnormalised reaches the row.
 */""",
    """/**
 * Trip tags (#71) — free text, normalised so the same label typed two ways is one tag on the
 * /trips filter. Every writer runs its input through `parseTags`, so nothing unnormalised is stored.
 */""")
sub(p, """/** Comma-separated in the field, an array in the column. */
""", "")
sub(p, """/** Beyond this a trip card is a wall of pills, not a label. */""",
    """// Why: beyond this a trip card is a wall of pills, not a label.""")
sub(p, """/**
 * Lower-cases, trims, collapses inner whitespace, drops blanks and duplicates,
 * and caps both the count and each tag's length. Order is what the author
 * typed — first mention wins, so re-saving doesn't shuffle the pills.
 */""",
    """// Why: order is what the author typed — first mention wins, so re-saving never shuffles the pills.""")
sub(p, """/** One tag's text, as it's stored: lower-case, single-spaced, length-capped. */
""", "")
sub(p, """/** The column back into the text field. */
""", "")
sub(p, """/**
 * Guards the read side too: `tags` is JSON, so a hand-edited row (or one
 * written before this column existed) can be anything at all. Rule 11 —
 * degrade, don't crash.
 */""",
    """// Why: `tags` is JSON, so a hand-edited row — or one written before the column existed — can hold
// anything at all. Rule 11.""")
sub(p, """/**
 * A tag save from the row editor: one name per row. Colour is no longer
 * per-tag — the whole trip wears one chosen pastel (ticket 213), so a tag is
 * just its text. A blank row deletes a tag; normalisation drops dupes and caps
 * the count.
 */""",
    """// Why: one name per row, no colour — the whole trip wears one chosen pastel (#213), so a tag is
// just its text, and a blank row deletes it.""")

p = "floc/packages/floc-core/src/billing/subscription-copy.ts"
sub(p, """/**
 * How a subscription reads on the settings page (ticket 247). Pure, so the
 * "renews" versus "ends" distinction — the whole reason the record stores a
 * period end rather than a boolean — is testable without Stripe or a request.
 *
 * `isLive` mirrors server/entitlements.ts deliberately: that one guards
 * features, this one only picks words. Neither may drift, so both are short
 * enough to read side by side.
 */""",
    """/**
 * How a subscription reads on the settings page (#247). Pure, so "renews" versus "ends" — the
 * reason the record stores a period end rather than a boolean — is testable without Stripe.
 *
 * Why: `isLive` mirrors `server/entitlements.ts` on purpose; that one guards features, this one
 * only picks words. Both stay short enough to read side by side so neither drifts.
 */""")
sub(p, """/** The parts of a subscription row that decide the wording. */
""", "")
sub(p, """/**
 * Cancelling in Stripe's portal leaves the subscription `active` with
 * `cancel_at_period_end` set, so the honest word is "ends" — someone who
 * cancelled keeps Pro until the date, and must not be told it renews.
 */""",
    """// Why: Stripe's portal leaves a cancelled subscription `active` with `cancel_at_period_end`, so
// the honest word is "ends" — they keep Pro until the date and must not be told it renews.""")
sub(p, """/**
 * How much cheaper a year is than twelve months of the monthly price, as a
 * whole percent (ticket 250). Null when there is nothing to boast about, so
 * the page never advertises a saving of 0% — or a negative one.
 */""",
    """// Why: null when there is nothing to boast about, so the page never advertises a 0% saving —
// or a negative one (#250).""")
print("done")
