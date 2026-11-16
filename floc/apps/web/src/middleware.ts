import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

import { contentSecurityPolicy, NONCE_HEADER } from "@/lib/http/csp";

const SIGNED_IN_ONLY = /^\/(trips|trip|friends|profile|settings)(\/|$)/;

function signedFileLink(request: NextRequest): boolean {
  return (
    /^\/trip\/\d+\/files\/\d+\/raw$/.test(request.nextUrl.pathname) &&
    request.nextUrl.searchParams.has("t")
  );
}

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
  matcher: ["/((?!api/|_next/|.*\\.(?:png|jpg|svg|ico|txt|json|geojson|webmanifest|woff2)$).*)"],
};
