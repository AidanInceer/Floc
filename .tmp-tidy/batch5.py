import io


def sub(path, old, new):
    s = io.open(path, encoding="utf-8", newline="").read()
    crlf = "\r\n" in s
    o = old.replace("\n", "\r\n") if crlf else old
    n = new.replace("\n", "\r\n") if crlf else new
    assert s.count(o) == 1, (path, "matches=%d" % s.count(o), old[:60])
    io.open(path, "w", encoding="utf-8", newline="").write(s.replace(o, n))


p = "floc/packages/floc-api/src/port.ts"

# The "what the host must provide" block was stranded above MyProfile; it describes FlocPort.
sub(p, """/**
 * What the host must provide. Every trip-scoped method takes the trip id AND
 * the viewer id, and must resolve access itself — the router will not have
 * loaded the row for it. That keeps rule 5 in one place on the host side,
 * where `requireTripAccess` already lives, instead of being re-derived here.
 */
/**
 * The face half of a profile (ticket 302, direction C) — what you *curate*,
 * as against what you configure. Kept off `Me` on purpose: the packing screen
 * reads `me` too, and it has no use for a travel map.
 *
 * The map is codes and states, not names: `@floc/core/countries` names them,
 * and both clients already have it, so sending the words would be sending what
 * the reader already holds.
 */""",
    """/**
 * The face half of a profile (#302) — what you curate, as against what you configure. Kept off
 * `Me` because the packing screen reads `me` too and has no use for a travel map.
 *
 * Why: the map is codes and states, not names — `@floc/core/countries` names them and both clients
 * already have it.
 */""")

# Orphan: this described listTrips, which moved ~230 lines down and reads plainly there.
sub(p, """export type FlocPort = {
  /** The viewer's trips. Never another user's, whatever id is passed. */
  /**""",
    """/**
 * What the host must provide. Every trip-scoped method takes the trip id and the viewer id and
 * resolves access itself — the router has not loaded the row for it. Why: that keeps rule 5 on the
 * host side, where `requireTripAccess` already lives, instead of re-derived here.
 */
export type FlocPort = {
  /**""")
sub(p, """  listTrips(viewerId: string, options: { archived: boolean }): Promise<TripSummary[]>;""",
    """  // The viewer's trips. Never another user's, whatever id is passed.
  listTrips(viewerId: string, options: { archived: boolean }): Promise<TripSummary[]>;""")

sub(p, """/**
 * The port every client reads a trip through (ticket 287).
 *
 * This package declares the API's *shape* — its procedures, its input rules,
 * and who is allowed to call what. It never opens a database: the host passes
 * in an implementation of `FlocPort`, and the web app's is the same
 * `src/server/` modules the pages already use. That is the whole point of the
 * seam. There is exactly one set of rules, and the phone app cannot reach
 * around it to the tables (guidance: mobile never talks to Turso directly).
 *
 * The types here are the wire contract. They are deliberately plain — ids,
 * strings, `YYYY-MM-DD` dates and integer minor units — so that nothing about
 * Drizzle, libSQL or Next leaks to a client that has none of them.
 *""",
    """/**
 * The port every client reads a trip through (#287). Declares the API's shape — procedures, input
 * rules, who may call what — and never opens a database: the host passes in a `FlocPort`, and the
 * web app's is the same `src/server/` modules the pages use.
 *
 * Why: one set of rules, which the phone cannot reach around to the tables. The types are the wire
 * contract and deliberately plain — ids, strings, `YYYY-MM-DD`, integer minor units — so nothing
 * about Drizzle, libSQL or Next leaks to a client that has none of them.
 *""")

sub(p, """/**
 * One file on a trip (ticket 296).
 *
 * `ownerId` is the private/shared line: null means the whole trip can see it,
 * and a set value is only ever the viewer's own — the implementation filters
 * somebody else's private file out rather than returning it flagged.
 */""",
    """/**
 * One file on a trip (#296). `ownerId` is the private/shared line: null is the whole trip, and a
 * set value is only ever the viewer's own — somebody else's private file is filtered out, not
 * returned flagged.
 */""")
sub(p, """  /** ISO 8601 instant. The one place a time crosses this wire, and it is a record of an upload, not an itinerary time (rule 10). */""",
    """  // ISO 8601 instant — a record of an upload, not an itinerary time, so rule 10 does not apply.""")
sub(p, """  /**
   * The live event it is parked on, if any (tickets 320, 325). A soft-deleted
   * event reads as null here: an event that goes unattaches its files, it never
   * takes them with it.
   */""",
    """  // Why: a soft-deleted event reads as null — an event that goes unattaches its files rather than
  // taking them with it (#320, #325).""")
sub(p, """  /** That event's own name, so a row can say what it is for without a second read. */""",
    """  // The event's own name, so a row says what it is for without a second read.""")
sub(p, """/**
 * One comment on an event (ticket 325). Replies are exactly one level deep, so
 * a reply never carries replies of its own.
 *
 * `createdAt` is an ISO 8601 instant — a record of when somebody typed, not an
 * itinerary time, so rule 10 does not apply to it.
 */""",
    """/**
 * One comment on an event (#325). Replies are exactly one level deep, so a reply never carries
 * replies of its own. `createdAt` is an instant — when somebody typed, not an itinerary time.
 */""")
sub(p, """/**
 * One idea for the trip, with its tally. `createdAt` crosses as an ISO string
 * — it records when somebody typed, not an itinerary date, so rule 10 does not
 * apply, but a `Date` does not survive JSON.
 */""",
    """// One idea for the trip, with its tally. `createdAt` is an instant, as a string — a `Date` does
// not survive JSON.""")
sub(p, """/**
 * A place the trip's days point at, for the map (ticket 296).
 *
 * This is NOT a stop. A stop is consecutive days sharing an overnight place
 * and is derived by `@floc/core/stops` from `listDays` (rule 3). This is the
 * flat set of places, with the coordinates a map needs and `listDays` does not
 * carry. `lat`/`lng` are nullable: a place typed during a provider outage has
 * none and simply does not reach the map (rule 11).
 */""",
    """/**
 * A place the trip's days point at, for the map (#296). Not a stop — a stop is consecutive days
 * sharing an overnight place, derived by `@floc/core/stops` from `listDays` (rule 3).
 *
 * Why: `lat`/`lng` are nullable, because a place typed during a provider outage has none and
 * simply does not reach the map (rule 11).
 */""")
sub(p, """/**
 * One country a trip you have left was claiming (ticket 95).
 *
 * Asked once, on the way out: the countries stop being derived the moment the
 * membership ends, so this is the only moment they can be kept. Named rather
 * than counted — "3 countries" is not an answerable question.
 */""",
    """/**
 * One country a trip you have left was claiming (#95). Why: asked on the way out, because the
 * countries stop being derived the moment the membership ends. Named, not counted — "3 countries"
 * is not an answerable question.
 */""")
sub(p, """/**
 * Everything the account half of the two faces holds (ticket 07, 46, 236).
 *
 * WHAT YOU CONFIGURE, IN ONE READ. The web draws this as eight panels behind a
 * rail and each panel saves on its own; the shape is still one row, so asking
 * for it eight times would be eight round trips for one record.
 *
 * `signInMethods` is Better Auth's, not the profile's — it rides here because
 * the Account panel draws both together and neither is worth its own call.
 */""",
    """/**
 * What you configure, in one read (#07, #46, #236). Why: the web draws eight panels that each save
 * on their own, but the shape is one row — asking eight times is eight round trips for one record.
 * `signInMethods` is Better Auth's and rides along because the Account panel draws both.
 */""")
sub(p, """/**
 * One saved packing list, with its things (ticket 230).
 *
 * Yours, not a trip's — a photography kit or gym stuff you copy into a bag
 * whenever you need it. Copying is one direction only: editing the bag on a
 * trip never writes back here.
 */""",
    """/**
 * One saved packing list, with its things (#230). Yours, not a trip's. Copying is one direction
 * only — editing the bag on a trip never writes back here.
 */""")
sub(p, """  /**
   * The event it lands on, when it was added from that event's modal (ticket
   * 325). Absent or null is the ordinary upload — the file sits on the trip
   * and nowhere in the itinerary.
   */""",
    """  // The event it lands on, when added from that event's modal (#325). Absent or null is the
  // ordinary upload: on the trip, nowhere in the itinerary.""")
sub(p, """  /**
   * The signed-in person, as their own profile shows them (ticket 302).
   *""",
    """  /**
   * The signed-in person, as their own profile shows them (#302).
   *""")
print("done")
