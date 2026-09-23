import io


def sub(path, old, new):
    s = io.open(path, encoding="utf-8", newline="").read()
    crlf = "\r\n" in s
    o = old.replace("\n", "\r\n") if crlf else old
    n = new.replace("\n", "\r\n") if crlf else new
    assert s.count(o) == 1, (path, "matches=%d" % s.count(o), old[:60])
    io.open(path, "w", encoding="utf-8", newline="").write(s.replace(o, n))


p = "floc/apps/mobile/src/components/files/file-picker.tsx"
sub(p, """/**
 * Choosing a file and turning it into something the API can take (ticket 239).
 *
 * ITS OWN FILE BECAUSE IT IS THE ONLY NATIVE THING ON THE SCREEN. The Files
 * screen is a list and two mutations; this is a picker, a disk read and a
 * base64 encode. Keeping them apart means the screen never has to know that a
 * phone has a filesystem.
 *
 * BASE64, NOT MULTIPART. There is no form to post from a phone, and the cap is
 * 8 MB either way — the wire carries a third more than the file, on a rare
 * action, rather than growing a second upload endpoint with its own auth.
 *
 * CANCELLING IS NOT AN ERROR. Backing out of the picker is the ordinary way to
 * leave it, so it answers null and the screen says nothing.
 *
 * `File`, NOT `readAsStringAsync`. The old top-level reader is still exported
 * and still typechecks, but it is a deprecation shim that throws the moment it
 * runs — so the compiler is no help here and the import has to be the new one.
 */""",
    """/**
 * Choosing a file and encoding it for the API (#239). Its own file so the Files screen never has
 * to know a phone has a filesystem.
 *
 * Why: base64, not multipart — there is no form to post from a phone and the cap is 8 MB either
 * way, so a rare third more on the wire beats a second upload endpoint with its own auth.
 * `File`, not `readAsStringAsync`: the old reader still typechecks but throws the moment it runs.
 */""")
sub(p, """/**
 * Null means the person backed out. A thrown error means the file could not be
 * read, which the caller shows as a sentence rather than a crash (rule 11).
 */""",
    """// Why: null is cancelling, the ordinary way out of a picker — only an unreadable file throws,
// and the caller shows that as a sentence (rule 11).""")
sub(p, """    // The same list the web's file input accepts, from one place — a phone
    // offering a type the server refuses is a refusal that arrives too late.""",
    """    // Why: the web input's own list — offering a type the server refuses refuses too late.""")
sub(p, """    // A picker that could not name the type still has to say something; the
    // server refuses an unknown type in the words the screen shows.""",
    """    // Why: a picker that cannot name the type still has to send one; the server refuses it.""")

p = "floc/packages/floc-core/src/trip/mark/trip-mark.ts"
sub(p, """/**
 * The mark a trip wears (#318). Ten places and holiday types, drawn in the
 * app's own hand — never a photo.
 *
 * WHY NOT AN IMAGE. `trip.cover_image_url` was free text pointing at a host we
 * do not control, which is the hotlinking, availability and content risk #157
 * took off a person's face. A trip is a different decision from a face, so it
 * was left alone then and answered here: the same rule, because the risk is the
 * same and nothing ever rendered the URL.
 *
 * TEN, NOT ELEVEN. The phone picker is two rows of five; an eleventh mark
 * orphans a row. Grow this set by five or not at all.
 *
 * Shape only. The pastel behind it is still `tripPastel` — the mark says what
 * kind of trip it is, the colour is how you follow one trip across the list,
 * its tags and its header, and letting the mark carry colour breaks that.
 */""",
    """/**
 * The mark a trip wears (#318) — ten places and holiday types in the app's own hand, never a photo.
 *
 * Why: an image URL means hotlinking, availability and content risk off a host we do not control,
 * the same call #157 made for a face. Ten because the phone picker is two rows of five — grow the
 * set by five or not at all. Shape only: colour stays `tripPastel`, which is how you follow one
 * trip across the list, its tags and its header.
 */""")
sub(p, """/** Values are stored; labels name the control. Order is picker order. */""",
    """// Values are stored; labels name the control. Order is picker order.""")
sub(p, """/**
 * Null means no mark, which is the default rather than a fallback — the trip
 * still has its pastel, so a mark dropped from the set in a later release
 * degrades to a colour, not a hole.
 */""",
    """// Why: null is the default, not a fallback — a mark dropped in a later release degrades to the
// trip's pastel rather than a hole.""")

p = "floc/apps/mobile/src/lib/map.ts"
sub(p, """/**
 * Tiles for the phone's route map (#no-ticket, the app half of v0.2 ticket 08).
 *
 * SAME TWO PROVIDERS AS THE WEB, for the same reason: with a MapTiler key the
 * classic colourful OSM style, without one raw OpenStreetMap tiles, so a build
 * with no key still draws a map (rule 11). `apps/web/src/lib/map.ts` is the
 * sibling — keep the pair honest, the two apps must not disagree about what a
 * map looks like.
 *
 * `EXPO_PUBLIC_` is the only prefix Expo inlines, and a MapTiler key is public
 * by design (restricted by referrer in their dashboard), so this is correct
 * rather than a leak.
 *
 * RASTER, DELIBERATELY. MapLibre would happily render the vector style, but
 * the web is on raster and matching it is worth more here than sharpness.
 *
 * The attribution must stay visible: MapTiler's terms and OSM's ODbL both
 * require it. `Map` shows it through its own attribution button, which is why
 * `attribution` is never switched off at the call site.
 */""",
    """/**
 * Tiles for the phone's route map. Sibling of `apps/web/src/lib/map.ts` — keep the pair honest.
 *
 * Why: MapTiler with a key, raw OpenStreetMap without one, so a keyless build still draws a map
 * (rule 11). `EXPO_PUBLIC_` is the only prefix Expo inlines and a MapTiler key is public by
 * design, restricted by referrer. Raster, to match the web, over vector sharpness. Attribution
 * must stay visible — MapTiler's terms and OSM's ODbL both require it.
 */""")
sub(p, """/**
 * A whole style built from one raster source. MapLibre needs a style document,
 * not a tile URL, and hosting one for a single layer would be a network round
 * trip and a thing to keep alive for no gain.
 */""",
    """// Why: MapLibre needs a style document, not a tile URL, and hosting one for a single layer is a
// round trip and a thing to keep alive for no gain.""")
sub(p, """/**
 * The style the travel map draws on: paper, no tiles.
 *
 * The countries are the drawing. Tiles under them would be a second map
 * competing with the shapes, and would drag a tile host into a screen that
 * needs no geography beyond an outline — which is the same call the web makes.
 */""",
    """// Why: paper, no tiles — the countries are the drawing, and tiles would compete with the shapes
// and drag a tile host into a screen that needs no geography. Same call as the web.""")

p = "floc/apps/mobile/src/lib/dev-sign-in.ts"
sub(p, """/**
 * Signing in on a dev build without typing anything (#no-ticket).
 *
 * The dev server holds the test accounts' credentials in its own `.env` and in
 * the seed, and hands them out on `GET /api/dev/sign-in`, but only when it is
 * not production and both variables are set — otherwise that route 404s. This
 * asks, and then signs in down the ordinary `signIn.email` path, so the token
 * lands in the keychain exactly as a typed sign-in would.
 *
 * MORE THAN ONE ACCOUNT, because half of Floc only exists between people: a
 * claim somebody else made, money somebody else paid, an invite you have not
 * answered. `pnpm db:seed` makes the cast; this lets you be any of them.
 *
 * `__DEV__` guards the caller too, so nothing about this is in a store build.
 */""",
    """/**
 * Signing in on a dev build without typing anything. Asks `GET /api/dev/sign-in` for the seeded
 * credentials, then signs in down the ordinary `signIn.email` path so the token lands in the
 * keychain as a typed sign-in would.
 *
 * Why: the whole cast, not one account — half of Floc only exists between people. `__DEV__` guards
 * the caller too, so none of this is in a store build.
 */""")
sub(p, """/** The roster, or null when the server is not offering one. */""",
    """// The roster, or null when the server is not offering one.""")
sub(p, """    // `accounts` arrived after the top-level pair; fall back so a phone built
    // against the newer server still works against an older one.""",
    """    // Why: `accounts` arrived after the top-level pair — fall back for an older server.""")
sub(p, """    // No server, no LAN, no dev account. All the same answer here.""",
    """    // No server, no LAN, no dev account — all the same answer here.""")
sub(p, """/**
 * Null when it worked; otherwise what to say. Omit the account to take the
 * first one, which is always your own.
 *
 * SAYS WHAT ACTUALLY BROKE. This used to guess — every failure printed "the
 * dev account exists in .env but not in the database", which sent an hour
 * chasing a database that was fine. A guess that names the wrong cause is
 * worse than no message, so the server's own words are passed through.
 */""",
    """/**
 * Null when it worked; otherwise what to say. Omit the account for the first, which is your own.
 *
 * Why: the server's own words, passed through. This used to print one guess for every failure and
 * sent an hour chasing a database that was fine.
 */""")
print("done")
