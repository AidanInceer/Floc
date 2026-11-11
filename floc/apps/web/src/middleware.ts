/**
 * First gate from ticket 05: an unauthenticated request to any authenticated
 * surface is redirected to /login with where it was headed, revealing nothing
 * about whether the trip exists.
 *
 * This is a cookie-presence check only — cheap, and safe because every page
 * and action re-verifies the session and membership server-side via
 * `requireTripAccess`. Membership (the enumeration-proof 404) is decided
 * there, not here, since middleware has no database access.
 *
 * It also gives every page its script nonce (#582): Next reads the nonce from the request's
 * policy and puts it on its own scripts; the layout reads `x-nonce` for the theme script.
 */
import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

import { contentSecurityPolicy, NONCE_HEADER } from "@/lib/http/csp";

const SIGNED_IN_ONLY = /^\/(trips|trip|friends|profile|settings)(\/|$)/;

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

/** Bytes, not a page: a file sets its own stricter policy, and a calendar feed needs none. */
function servesBytes(pathname: string): boolean {
  return /\/raw$|\.ics$/.test(pathname) || pathname.startsWith("/calendar/");
}

function toLogin(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?redirect=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (SIGNED_IN_ONLY.test(pathname) && !getSessionCookie(request) && !signedFileLink(request)) return toLogin(request);
  if (servesBytes(pathname)) return NextResponse.next();

  const nonce = btoa(crypto.randomUUID());
  const policy = contentSecurityPolicy({ nonce, host: request.headers.get("host") ?? request.nextUrl.host, dev: process.env.NODE_ENV !== "production" });
  const headers = new Headers(request.headers);
  headers.set(NONCE_HEADER, nonce);
  headers.set("Content-Security-Policy", policy);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

export const config = {
  // Every page and the two byte routes above. Not the API, Next's own files, or a static file.
  matcher: ["/((?!api/|_next/|.*\\.(?:png|jpg|svg|ico|txt|json|geojson|webmanifest|woff2)$).*)"],
};
