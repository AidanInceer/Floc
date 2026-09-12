/**
 * First gate from ticket 05: an unauthenticated request to any authenticated
 * surface is redirected to /login with where it was headed, revealing nothing
 * about whether the trip exists.
 *
 * This is a cookie-presence check only — cheap, and safe because every page
 * and action re-verifies the session and membership server-side via
 * `requireTripAccess`. Membership (the enumeration-proof 404) is decided
 * there, not here, since middleware has no database access.
 */
import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * A signed file link carries its own permission and no cookie (#325 feedback).
 * Redirecting it to /login is what stopped a file the phone handed a browser
 * from ever opening. The route checks the signature; this only lets it ask.
 */
function signedFileLink(request: NextRequest): boolean {
  return (
    /^\/trip\/\d+\/files\/\d+\/raw$/.test(request.nextUrl.pathname) &&
    request.nextUrl.searchParams.has("t")
  );
}

export function middleware(request: NextRequest) {
  const session = getSessionCookie(request);
  if (session || signedFileLink(request)) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?redirect=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/trips/:path*",
    "/trip/:path*",
    "/friends/:path*",
    "/profile/:path*",
    "/settings/:path*",
  ],
};
