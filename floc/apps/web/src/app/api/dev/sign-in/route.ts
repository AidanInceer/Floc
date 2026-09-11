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
 * IT OPENS ONTO THE WHOLE SEEDED CAST, not just your own account, so the
 * things that only happen between people can be tested from both ends. Which
 * addresses are allowed is `passwordFor`'s decision alone (see dev-accounts).
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
import { auth } from "@/server/auth/auth";
import { listDevAccounts, passwordFor } from "@/server/auth/dev-accounts";
import { devSignInEnabled } from "@/server/auth/dev-sign-in";

export const runtime = "nodejs";

const notFound = (): Response => new Response("Not found", { status: 404 });

/**
 * For the phone: the roster, so it can offer a picker and sign in through its
 * own client. `email`/`password` at the top level are the env account, kept
 * where they were so an older build of the app still works against a new
 * server.
 */
export async function GET(): Promise<Response> {
  if (!devSignInEnabled()) return notFound();

  const accounts = await listDevAccounts();
  return Response.json({
    email: process.env.FLOC_DEV_USER_EMAIL,
    password: process.env.FLOC_DEV_USER_PASSWORD,
    accounts: accounts.map((a) => ({
      ...a,
      password: passwordFor(a.email),
    })),
  });
}

/** For a browser: the session cookie, set by Better Auth's own response. */
export async function POST(request: Request): Promise<Response> {
  if (!devSignInEnabled()) return notFound();

  const email = new URL(request.url).searchParams.get("email");
  const password = passwordFor(email);
  if (!password) return notFound();

  return auth.api.signInEmail({
    body: { email: email ?? process.env.FLOC_DEV_USER_EMAIL!, password },
    asResponse: true,
  });
}
