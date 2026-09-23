import io


def sub(path, old, new):
    s = io.open(path, encoding="utf-8", newline="").read()
    crlf = "\r\n" in s
    o = old.replace("\n", "\r\n") if crlf else old
    n = new.replace("\n", "\r\n") if crlf else new
    assert s.count(o) == 1, (path, "matches=%d" % s.count(o), old[:60])
    io.open(path, "w", encoding="utf-8", newline="").write(s.replace(o, n))


sub("floc/apps/mobile/src/lib/dev-sign-in.ts", """/**
 * Signing in on a dev build without typing anything. Asks `GET /api/dev/sign-in` for the seeded
 * credentials, then signs in down the ordinary `signIn.email` path so the token lands in the
 * keychain as a typed sign-in would.
 *
 * Why: the whole cast, not one account — half of Floc only exists between people. `__DEV__` guards
 * the caller too, so none of this is in a store build.
 */""",
    """/**
 * Why: signing in on a dev build without typing anything. Asks `GET /api/dev/sign-in` for the
 * seeded credentials, then signs in down the ordinary `signIn.email` path, so the token lands in
 * the keychain as a typed sign-in would. The whole cast, not one account — half of Floc only
 * exists between people. `__DEV__` guards the caller too, so none of this is in a store build.
 */""")

sub("floc/apps/mobile/src/lib/map.ts", """/**
 * Tiles for the phone's route map. Sibling of `apps/web/src/lib/map.ts` — keep the pair honest.
 *
 * Why: MapTiler with a key, raw OpenStreetMap without one, so a keyless build still draws a map
 * (rule 11). `EXPO_PUBLIC_` is the only prefix Expo inlines and a MapTiler key is public by
 * design, restricted by referrer. Raster, to match the web, over vector sharpness. Attribution
 * must stay visible — MapTiler's terms and OSM's ODbL both require it.
 */""",
    """/**
 * Why: tiles for the phone's route map, sibling of `apps/web/src/lib/map.ts` — keep the pair
 * honest. MapTiler with a key, raw OpenStreetMap without one, so a keyless build still draws a map
 * (rule 11). `EXPO_PUBLIC_` is the only prefix Expo inlines and a MapTiler key is public by design,
 * restricted by referrer. Raster, to match the web, over vector sharpness. Attribution must stay
 * visible — MapTiler's terms and OSM's ODbL both require it.
 */""")

sub("floc/apps/web/src/app/api/dev/sign-in/route.ts", """/**
 * A sign-in with no form, for local testing only — driving either app through a real login screen
 * means typing a password into a field, which an agent will not do.
 *
 * Why: 404s unless dev sign-in is enabled (not production, both env vars set) — a disabled
 * backdoor that announces itself is still a map to it. Better Auth mints the session through the
 * same `signInEmail` the form calls, so there is no second definition of "signed in" to drift.
 * Two verbs because the clients store a session differently: POST returns Better Auth's own
 * `Set-Cookie` for a browser; a phone has no cookie jar, so GET hands it the credentials and it
 * calls `signIn.email` itself. It opens onto the whole seeded cast so between-people behaviour
 * can be tested from both ends; `passwordFor` alone decides which addresses are allowed.
 */""",
    """/**
 * Why: a sign-in with no form, for local testing — driving either app through a real login screen
 * means typing a password into a field, which an agent will not do. It 404s unless dev sign-in is
 * enabled; a disabled backdoor that announces itself is still a map to it. Better Auth mints the
 * session through the same `signInEmail` the form calls, so there is no second definition of
 * "signed in" to drift. Two verbs because the clients store a session differently: POST returns
 * Better Auth's `Set-Cookie` for a browser; a phone has no cookie jar, so GET hands it the
 * credentials and it calls `signIn.email` itself. It opens onto the whole seeded cast so
 * between-people behaviour can be tested from both ends, and `passwordFor` alone decides which
 * addresses are allowed.
 */""")

sub("floc/apps/web/src/db/schema.ts", """/**
 * One real-world payment between members, recorded after money moved off-app.
 *
 * Why: its own table, not a flag on a split — settle-up is one transfer netted across many bills
 * and never maps to one owed row. An immutable fact, reverted only by soft-delete, so the balance
 * recomputes as if it never happened. Balances stay derived at read time: expenses − settlements,
 * per currency.
 */""",
    """/**
 * Why: one real-world payment between members, recorded after money moved off-app. Its own table,
 * not a flag on a split — settle-up is one transfer netted across many bills and never maps to one
 * owed row. An immutable fact, reverted only by soft-delete, so the balance recomputes as if it
 * never happened. Balances stay derived at read time: expenses − settlements, per currency.
 */""")
print("done")
