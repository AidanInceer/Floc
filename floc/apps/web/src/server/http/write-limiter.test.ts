import { describe, expect, it } from "vitest";

import { clientKey, isLimitedWrite, writeLimiter } from "./write-limiter";

describe("the write limiter", () => {
  it("lets a burst through up to its capacity, then refuses", () => {
    const limiter = writeLimiter({ capacity: 3, perSecond: 1 });
    expect([1, 2, 3].map(() => limiter.allow("a", 0))).toEqual([true, true, true]);
    expect(limiter.allow("a", 0)).toBe(false);
  });

  it("refills with time", () => {
    const limiter = writeLimiter({ capacity: 2, perSecond: 1 });
    limiter.allow("a", 0);
    limiter.allow("a", 0);
    expect(limiter.allow("a", 0)).toBe(false);
    expect(limiter.allow("a", 1000)).toBe(true);
  });

  it("keeps each caller's bucket apart", () => {
    const limiter = writeLimiter({ capacity: 1, perSecond: 1 });
    expect(limiter.allow("a", 0)).toBe(true);
    expect(limiter.allow("b", 0)).toBe(true);
    expect(limiter.allow("a", 0)).toBe(false);
  });

  it("forgets callers past its size, so a spray of addresses cannot grow memory", () => {
    const limiter = writeLimiter({ capacity: 1, perSecond: 1, maxKeys: 2 });
    for (const key of ["a", "b", "c", "d"]) limiter.allow(key, 0);
    expect(limiter.size()).toBeLessThanOrEqual(2);
  });

  it("never forgets a caller it is refusing while it can forget one in credit (#582)", () => {
    const limiter = writeLimiter({ capacity: 2, perSecond: 0.001, maxKeys: 2 });
    limiter.allow("flood", 0);
    limiter.allow("flood", 0);
    expect(limiter.allow("flood", 0)).toBe(false);
    limiter.allow("quiet", 0);
    limiter.allow("new", 0);
    expect(limiter.allow("flood", 0)).toBe(false);
  });
});

describe("which requests count", () => {
  it("counts a Server Action or an API change", () => {
    expect(isLimitedWrite("POST", "/trip/4/days")).toBe(true);
    expect(isLimitedWrite("POST", "/api/trpc/itinerary.addEvent")).toBe(true);
  });

  it("leaves reads alone", () => {
    expect(isLimitedWrite("GET", "/trip/4/days")).toBe(false);
    expect(isLimitedWrite("HEAD", "/")).toBe(false);
  });

  it("leaves signed machine callers and sign-in to their own guards", () => {
    for (const path of ["/api/auth/sign-in/email", "/api/billing/webhook", "/api/billing/app-store", "/api/billing/play", "/api/inbound", "/api/cron/push"]) {
      expect(isLimitedWrite("POST", path)).toBe(false);
    }
  });
});

describe("who is calling", () => {
  it("is the address Railway's edge saw", () => {
    expect(clientKey("203.0.113.7", "10.0.0.2")).toBe("203.0.113.7");
  });

  it("counts one IPv6 network as one caller, since a caller owns the whole /64 (#582)", () => {
    expect(clientKey("2001:db8:1:2:aaaa:bbbb:cccc:dddd", undefined)).toBe(clientKey("2001:db8:1:2::1", undefined));
    expect(clientKey("2001:db8:1:3::1", undefined)).not.toBe(clientKey("2001:db8:1:2::1", undefined));
    expect(clientKey("2001:db8::1", undefined)).toBe(clientKey("2001:db8:0:0:ffff::9", undefined));
  });

  it("falls back to the socket's address", () => {
    expect(clientKey(undefined, "10.0.0.2")).toBe("10.0.0.2");
  });

  it("is nobody for this machine's own calls, which are never limited", () => {
    expect(clientKey(undefined, "127.0.0.1")).toBeNull();
    expect(clientKey(undefined, "::1")).toBeNull();
    expect(clientKey(undefined, "::ffff:127.0.0.1")).toBeNull();
  });
});
