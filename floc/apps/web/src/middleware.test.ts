import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { middleware } from "./middleware";

const ask = (path: string, cookie?: string) =>
  middleware(new NextRequest(`https://floc.live${path}`, { headers: { host: "floc.live", ...(cookie ? { cookie } : {}) } }));

const SIGNED_IN = "better-auth.session_token=abc.def";
const policyOf = (response: Response) => response.headers.get("content-security-policy");

describe("the sign-in gate", () => {
  it("sends a signed-out visitor to sign in, with where they were headed", () => {
    const response = ask("/trip/7/money?sheet=add");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://floc.live/login?redirect=%2Ftrip%2F7%2Fmoney%3Fsheet%3Dadd");
  });

  it("guards every signed-in area and nothing with a similar name", () => {
    for (const path of ["/trips", "/trip/7", "/friends", "/profile", "/settings"]) {
      expect(ask(path).headers.get("location")).toContain("/login?redirect=");
    }
    for (const path of ["/", "/explore", "/tripsy", "/invite/abc"]) {
      expect(ask(path).headers.get("location")).toBeNull();
    }
  });

  it("lets a signed-in visitor through", () => {
    expect(ask("/trip/7/money", SIGNED_IN).headers.get("location")).toBeNull();
  });

  it("lets a signed file link ask without a session, since the route checks its signature", () => {
    expect(ask("/trip/7/files/3/raw?t=123.sig").headers.get("location")).toBeNull();
    expect(ask("/trip/7/files/3/raw").headers.get("location")).toContain("/login?redirect=");
  });
});

describe("the page policy (#582)", () => {
  it("gives a page a policy with a nonce, and hands the same nonce to the layout", () => {
    const response = ask("/explore");
    const nonce = response.headers.get("x-middleware-request-x-nonce");
    expect(nonce).toBeTruthy();
    expect(policyOf(response)).toContain(`'nonce-${nonce}' 'strict-dynamic'`);
    expect(response.headers.get("x-middleware-request-content-security-policy")).toBe(policyOf(response));
  });

  it("makes a new nonce for every response", () => {
    expect(ask("/explore").headers.get("x-middleware-request-x-nonce")).not.toBe(ask("/explore").headers.get("x-middleware-request-x-nonce"));
  });

  it("allows the notes socket on the host the visitor used", () => {
    expect(policyOf(ask("/trip/7/notes", SIGNED_IN))).toContain("connect-src 'self' ws://floc.live wss://floc.live");
  });

  it("leaves bytes alone: a file sets its own policy and a calendar feed needs none", () => {
    for (const path of ["/trip/7/files/3/raw?t=123.sig", "/calendar/token.ics", "/calendar/token"]) {
      expect(policyOf(ask(path))).toBeNull();
    }
    expect(policyOf(ask("/trip/7/calendar.ics", SIGNED_IN))).toBeNull();
  });
});
