import io


def sub(path, old, new):
    s = io.open(path, encoding="utf-8", newline="").read()
    crlf = "\r\n" in s
    o = old.replace("\n", "\r\n") if crlf else old
    n = new.replace("\n", "\r\n") if crlf else new
    assert s.count(o) == 1, (path, "matches=%d" % s.count(o), old[:60])
    io.open(path, "w", encoding="utf-8", newline="").write(s.replace(o, n))


p = "floc/apps/mobile/src/lib/api.ts"
sub(p, """/**
 * The typed client for `@floc/api` (ticket 289).
 *
 * `AppRouter` is imported as a TYPE. No server code crosses into the bundle —
 * if this import ever stops saying `import type`, the app would try to pull
 * the database layer onto a phone.
 *
 * The cache is React Query's, chosen because it can be persisted to disk
 * later without changing a single call site — that is what on-trip mode
 * (#226) will need. It is deliberately NOT persisted yet: a plan cached on a
 * device with no way to invalidate it is worse than no plan, and offline is
 * its own ticket.
 */""",
    """/**
 * The typed client for `@floc/api` (#289).
 *
 * Why: `AppRouter` is an `import type` — drop that and the app pulls the database layer onto a
 * phone. React Query so on-trip mode (#226) can persist the cache later without touching a call
 * site; not persisted yet, because a plan cached with no way to invalidate it is worse than none.
 */""")
sub(p, """      // A trip is edited by other people while you are looking at it, and
      // last-write-wins (rule 7) means the screen is only ever as fresh as its
      // last read — so it re-reads on a tick rather than waiting to be asked.
      // Fifteen seconds: fast enough that a trip deleted in a browser leaves
      // the phone while you are still looking at it, slow enough that a group
      // of six is not a load test. `refetchIntervalInBackground` stays off, so
      // a pocketed phone asks nothing.""",
    """      // Why: last-write-wins (rule 7) makes a screen only as fresh as its last read, so it
      // re-reads on a tick. Fifteen seconds catches a trip deleted in a browser without turning a
      // group of six into a load test; `refetchIntervalInBackground` stays off for a pocketed phone.""")
sub(p, """/**
 * React Query's idea of "focused" is a browser tab. On a phone it is the app
 * being in front of you, and without this it is focused forever — so nothing
 * refetched on coming back, and the polling above would run in your pocket.
 */""",
    """// Why: React Query's "focused" means a browser tab, so on a phone it is focused forever —
// nothing refetches on returning and the polling above runs in your pocket.""")

p = "floc/packages/floc-api/src/routers/availability.ts"
sub(p, """/**
 * Who can do which days (ticket 297).
 *
 * READ IS THE GROUP'S, WRITE IS YOUR OWN. `list` returns everybody's marks,
 * because the whole point of the Dates screen is seeing where the group
 * overlaps. `set` takes no user id at all: it writes the caller's marks and
 * there is no shape of request that writes somebody else's.
 *
 * That is deliberate and is not an oversight to be fixed later. The three admin
 * powers are kick, promote and delete/archive (rule 6) — answering for
 * another person is not among them, and an admin who could would make the
 * answer worthless.
 *
 * The maths over these rows lives in `@floc/core/availability`, shared with
 * the web app. Nothing is computed here.
 */""",
    """/**
 * Who can do which days (#297). The maths lives in `@floc/core/availability`, shared with the web.
 *
 * Why: read is the group's, write is your own. `set` takes no user id, so no shape of request
 * writes somebody else's marks — answering for another person is not an admin power (rule 6), and
 * an admin who could would make the answer worthless.
 */""")
sub(p, """/** `YYYY-MM-DD`. No timezone and no offset ever crosses this wire (rule 10). */""",
    """// `YYYY-MM-DD`. No timezone and no offset ever crosses this wire (rule 10).""")
sub(p, """/**
 * A year of dates in one call is already far more than a person paints in one
 * gesture; the cap is here so a malformed client cannot ask for a million-row
 * insert, not because anyone will reach it.
 */""",
    """// Why: a cap against a malformed client asking for a million-row insert, not a limit anyone
// paints into.""")

p = "floc/apps/web/src/server/documents/view-link.ts"
sub(p, """/**
 * A short-lived link that opens one file's bytes (#325 feedback).
 *
 * WHY IT EXISTS. The phone signs in with a bearer token, not a cookie, so a
 * browser handed `/trip/1/files/2/raw` lands on the sign-in page — the file
 * never opens. The app cannot put its header on a link, so the permission has
 * to ride in the link itself.
 *
 * WHAT IT GRANTS, AND FOR HOW LONG. One document, to whoever holds the URL,
 * for two minutes. It is minted only after the ordinary trip check has already
 * passed, so it never widens what its holder could see — it carries a decision
 * that was already made, it does not make one.
 *
 * SIGNED WITH THE SESSION SECRET. No second secret to leak or to forget to set
 * in a deployment, and rotating the session secret invalidates every live link.
 *
 * `timingSafeEqual` because a signature check that returns early tells an
 * attacker how much of a guess was right.
 */""",
    """/**
 * A short-lived link that opens one file's bytes (#325). Grants one document, to whoever holds the
 * URL, for two minutes — minted only after the ordinary trip check passed, so it carries a
 * decision rather than making one.
 *
 * Why: the phone signs in with a bearer token and cannot put its header on a link, so a browser
 * handed the raw path lands on sign-in instead of the file. Signed with the session secret — no
 * second secret to leak, and rotating it kills every live link. `timingSafeEqual` because a check
 * that returns early tells an attacker how much of a guess was right.
 */""")
sub(p, """/** Two minutes: long enough to open a browser, short enough that a shared URL is dead. */""",
    """// Two minutes: long enough to open a browser, short enough that a shared URL is dead.""")
sub(p, """/** The `?t=` value for this document. The caller has already proved it may read it. */""",
    """// The `?t=` value for this document. The caller has already proved it may read it.""")
sub(p, """/** True when `token` was minted for this document and has not run out. */
""", "")

p = "floc/packages/floc-core/src/people/avatar-icon.ts"
sub(p, """/**
 * The face a person picks (ticket 157). Seventeen travel objects, drawn in the
 * app's own hand — never a photo.
 *
 * SEVENTEEN, NOT EIGHTEEN. With the initials cell the picker is eighteen, which
 * is three full rows of six. A nineteenth left one orphan on a row of its own.
 *
 * NO UPLOADS, NO REMOTE IMAGES. A roster mixing photographs and line art reads
 * as broken rather than varied, and an image on a host we do not control
 * carries hotlinking, availability and content risk for no gain. The provider
 * photo went with the upload field.
 *
 * Shape only. The pastel behind it still comes from `whoTone` — the icon is
 * identity, the colour is how you follow one member across Money, Packing and
 * the itinerary, and letting people pick the colour breaks that.
 *
 * Birds were drawn and rejected: they do not hold apart at 28px.
 */""",
    """/**
 * The face a person picks (#157) — seventeen travel objects in the app's own hand, never a photo.
 *
 * Why: seventeen plus the initials cell is three full rows of six, and a nineteenth orphans a row.
 * No uploads or remote images: a roster mixing photographs and line art reads as broken, and an
 * image on a host we do not control carries hotlinking, availability and content risk. Shape only
 * — colour comes from `whoTone`, which is how you follow one member across Money and Packing.
 * Birds were drawn and rejected; they do not hold apart at 28px.
 */""")
sub(p, """/** Values are stored; labels name the control. Order is picker order. */""",
    """// Values are stored; labels name the control. Order is picker order.""")
sub(p, """/**
 * Null means initials, which is the default rather than a fallback — so an
 * icon dropped from the set in a later release degrades to a name, not a hole.
 */""",
    """// Why: null is the default, not a fallback — an icon dropped in a later release degrades to
// initials rather than a hole.""")
print("done")
