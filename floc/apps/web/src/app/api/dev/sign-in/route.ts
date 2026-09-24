/**
 * Why: a sign-in with no form, for local testing — driving either app through a real login screen
 * means typing a password into a field, which an agent will not do. It 404s unless dev sign-in is
 * enabled; a disabled backdoor that announces itself is still a map to it. Better Auth mints the
 * session through the same `signInEmail` the form calls, so there is no second definition of
 * "signed in" to drift. Two verbs because the clients store a session differently: POST returns
 * Better Auth's `Set-Cookie` for a browser; a phone has no cookie jar, so GET hands it the
 * credentials and it calls `signIn.email` itself. It opens onto the whole seeded cast so
 * between-people behaviour can be tested from both ends, and `passwordFor` alone decides which
 * addresses are allowed.
 */
import { auth } from "@/server/auth/auth";
import { listDevAccounts, passwordFor } from "@/server/auth/dev-accounts";
import { devSignInEnabled } from "@/server/auth/dev-sign-in";

export const runtime = "nodejs";

const notFound = (): Response => new Response("Not found", { status: 404 });

// Why: top-level `email`/`password` stay beside `accounts` so an older build of the app still
// signs in against a new server.
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
