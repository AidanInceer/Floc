/**
 * A sign-in with no form, for local testing only (#no-ticket).
 *
 * WHY IT EXISTS. Driving the web app or the phone app through a real login
 * screen means typing a password into a field, which an agent will not do.
 * This gives the same session without one: the credentials sit in `.env`
 * (gitignored) and never leave the server.
 *
 * IT IS OFF UNLESS THREE THINGS ARE TRUE. Not production, and both
 * `FLOC_DEV_USER_EMAIL` and `FLOC_DEV_USER_PASSWORD` set. Any one missing and
 * the route 404s exactly as if the file were not here — a disabled backdoor
 * that announces itself is still a map to the backdoor.
 *
 * BETTER AUTH STILL MINTS THE SESSION. This does not write a `session` row of
 * its own: it calls the same `signInEmail` the form calls, so the cookie, the
 * bearer token and the expiry are whatever the real path produces. There is no
 * second definition of "signed in" to drift.
 *
 * TWO VERBS, BECAUSE THE TWO CLIENTS STORE A SESSION DIFFERENTLY. POST signs
 * in and hands back Better Auth's own response, which is the `Set-Cookie` a
 * browser needs. A phone has no cookie jar and keeps its token in the keychain
 * via the Expo client, so it cannot use somebody else's response — GET hands
 * it the credentials instead and it calls `signIn.email` itself, down the
 * exact path the sign-in form uses. The password only ever travels on a dev
 * LAN, to a device the developer owns, and only while the gate below is open.
 */
import { auth } from "@/server/auth";

export const runtime = "nodejs";

/** Production is never a place this answers, whatever the variables say. */
function enabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return !!process.env.FLOC_DEV_USER_EMAIL && !!process.env.FLOC_DEV_USER_PASSWORD;
}

/** For the phone: the credentials, so it can sign in through its own client. */
export async function GET(): Promise<Response> {
  if (!enabled()) return new Response("Not found", { status: 404 });

  return Response.json({
    email: process.env.FLOC_DEV_USER_EMAIL,
    password: process.env.FLOC_DEV_USER_PASSWORD,
  });
}

/** For a browser: the session cookie, set by Better Auth's own response. */
export async function POST(): Promise<Response> {
  if (!enabled()) return new Response("Not found", { status: 404 });

  return auth.api.signInEmail({
    body: {
      email: process.env.FLOC_DEV_USER_EMAIL!,
      password: process.env.FLOC_DEV_USER_PASSWORD!,
    },
    asResponse: true,
  });
}
