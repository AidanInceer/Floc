/**
 * Why: `/floc:scenario` hands you one link that drops you at the start of a dev scenario, in any
 * browser. A GET that signs in is only safe behind the same gate as the dev sign-in door, and
 * `as` is a user id so no address goes in a URL. No `as` signs you out.
 */
import { auth } from "@/server/auth/auth";
import { devAccountEmail, passwordFor } from "@/server/auth/dev-accounts";
import { devSignInEnabled } from "@/server/auth/dev-sign-in";

export const runtime = "nodejs";

const notFound = (): Response => new Response("Not found", { status: 404 });

function localPath(to: string | null): string | null {
  if (!to || !to.startsWith("/") || to.startsWith("//") || to.includes("\\")) return null;
  return to;
}

function signOutCookies(request: Request): string[] {
  const names = (request.headers.get("cookie") ?? "")
    .split(";")
    .map((pair) => pair.split("=")[0].trim())
    .filter((name) => name.includes("better-auth."));
  return names.map((name) => `${name}=; Path=/; Max-Age=0`);
}

export async function GET(request: Request): Promise<Response> {
  if (!devSignInEnabled()) return notFound();

  const query = new URL(request.url).searchParams;
  const to = localPath(query.get("to"));
  if (!to) return notFound();

  const cookies = signOutCookies(request);
  const as = query.get("as");
  if (as) {
    const email = await devAccountEmail(as);
    const password = email ? passwordFor(email) : null;
    if (!email || !password) return notFound();
    const signedIn = await auth.api.signInEmail({ body: { email, password }, asResponse: true });
    if (!signedIn.ok) return signedIn;
    cookies.push(...signedIn.headers.getSetCookie());
  }

  const headers = new Headers({ Location: to });
  for (const cookie of cookies) headers.append("Set-Cookie", cookie);
  return new Response(null, { status: 303, headers });
}
